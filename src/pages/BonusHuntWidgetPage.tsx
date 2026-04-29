import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API_BASE } from "@/lib/api";

type HuntStatus = "draft" | "ongoing" | "finished";

interface BonusHuntSummary {
  _id: string;
  title: string;
  startCost: number;
  targetProfit: number;
  status: HuntStatus;
  startedAt?: string | null;
  finishedAt?: string | null;
}

interface BonusHuntGame {
  _id: string;
  order: number;
  slotId: string;
  slotName: string;
  provider?: string;
  image?: string;
  url?: string;
  betSize: number;
  bonusType: "normal" | "super";
  note?: string;
  payout: number | null;
  multiplier: number | null;
  status: "draft" | "completed";
  locked: boolean;
}

interface BonusHuntStats {
  totalGames: number;
  completedGames: number;
  remainingGames: number;
  progressPercent: number;
  plannedBetTotal: number;
  completedBetTotal: number;
  totalWinnings: number;
  profitLoss: number;
  runAvgX: number;
  reqAvgBreakEvenX: number;
  reqAvgTargetX: number | null;
  targetProfit: number;
}

interface BonusHuntView {
  hunt: BonusHuntSummary | null;
  games: BonusHuntGame[];
  stats: BonusHuntStats | null;
}

interface BonusHuntHistoryItem {
  hunt: BonusHuntSummary;
  games: BonusHuntGame[];
  stats: BonusHuntStats;
}

const EMPTY_VIEW: BonusHuntView = { hunt: null, games: [], stats: null };
const CARDS_PER_SLIDE = 3;
const CYCLE_MS = 4200;

const fmt = (v: number | null | undefined): string =>
  v == null || isNaN(Number(v)) ? "—" : Number(v).toLocaleString();

const fmtX = (v: number | null | undefined): string =>
  v == null || isNaN(Number(v)) ? "—" : `${Number(v).toFixed(2)}x`;

const fmtPnL = (v: number | null | undefined): string => {
  if (v == null || isNaN(Number(v))) return "—";
  const n = Number(v);
  return n >= 0 ? `+$${fmt(n)}` : `-$${fmt(Math.abs(n))}`;
};

const STATUS_LABEL: Record<HuntStatus, string> = {
  draft: "Upcoming",
  ongoing: "Live",
  finished: "Finished",
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function ImagePlaceholder() {
  return (
    <div className="flex h-20 w-full flex-shrink-0 items-center justify-center bg-[#181818]">
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-white/10"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    </div>
  );
}

function GameCard({ game }: { game: BonusHuntGame }) {
  const done = game.status === "completed";
  return (
    <article
      className={`flex flex-col overflow-hidden rounded-xl border bg-[#111] transition-colors ${
        done ? "border-[#C9974A]/22" : "border-white/6"
      }`}
    >
      {game.image ? (
        <img
          src={game.image}
          alt={game.slotName}
          className="flex-shrink-0 object-cover w-full h-20"
        />
      ) : (
        <ImagePlaceholder />
      )}

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold leading-snug text-[#F0EDE8]">
              {game.slotName}
            </p>
            <p className="mt-0.5 truncate font-mono text-[10px] text-white/40">
              {game.provider || "Unknown"}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-sm px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider ${
              game.bonusType === "super"
                ? "border border-[#C9974A]/35 bg-[#C9974A]/18 text-[#C9974A]"
                : "border border-white/8 bg-white/4 text-white/40"
            }`}
          >
            {game.bonusType}
          </span>
        </div>

        <div className="my-0.5 h-px bg-white/5" />

        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded-md bg-[#181818] px-2 py-1.5">
            <p className="font-mono text-[9px] uppercase tracking-widest text-white/30">Bet</p>
            <p className="mt-0.5 font-mono text-xs font-medium text-[#E8B96A]">${fmt(game.betSize)}</p>
          </div>
          <div className="rounded-md bg-[#181818] px-2 py-1.5">
            <p className="font-mono text-[9px] uppercase tracking-widest text-white/30">Multi</p>
            <p className={`mt-0.5 font-mono text-xs font-medium ${done ? "text-[#E8B96A]" : "text-white/30"}`}>
              {done ? fmtX(game.multiplier) : "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md bg-[#181818] px-2 py-1.5">
          <p className="font-mono text-[9px] uppercase tracking-widest text-white/30">Payout</p>
          <p className={`font-mono text-xs font-medium ${done ? "text-[#E8B96A]" : "text-white/30"}`}>
            {done ? `$${fmt(game.payout)}` : "Pending"}
          </p>
        </div>
      </div>
    </article>
  );
}

function Carousel({ games }: { games: BonusHuntGame[] }) {
  const [slide, setSlide] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const slides = useMemo(() => {
    const out: BonusHuntGame[][] = [];
    for (let i = 0; i < games.length; i += CARDS_PER_SLIDE) {
      out.push(games.slice(i, i + CARDS_PER_SLIDE));
    }
    return out;
  }, [games]);

  const goTo = useCallback(
    (i: number) => {
      setSlide(i);
      if (timerRef.current) clearInterval(timerRef.current);
      if (slides.length > 1) {
        timerRef.current = setInterval(
          () => setSlide((s) => (s + 1) % slides.length),
          CYCLE_MS
        );
      }
    },
    [slides.length]
  );

  useEffect(() => {
    setSlide(0);
    if (timerRef.current) clearInterval(timerRef.current);
    if (slides.length > 1) {
      timerRef.current = setInterval(
        () => setSlide((s) => (s + 1) % slides.length),
        CYCLE_MS
      );
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slides.length]);

  if (!games.length) {
    return (
      <div className="flex items-center justify-center flex-1 gap-2 font-mono text-xs text-white/25">
        No games added yet
      </div>
    );
  }

  const colClass = ["grid-cols-1", "grid-cols-2", "grid-cols-3"];
  const cols = colClass[Math.min(slides[slide]?.length ?? 1, 3) - 1];

  return (
    <div className="relative flex flex-col flex-1 overflow-hidden">
      <div className="relative flex-1 overflow-hidden">
        <div
          className="flex h-full transition-transform duration-500 ease-[cubic-bezier(.4,0,.2,1)]"
          style={{
            width: `${slides.length * 100}%`,
            transform: `translateX(-${(slide * 100) / slides.length}%)`,
          }}
        >
          {slides.map((group, si) => (
            <div
              key={si}
              className={`grid h-full gap-2.5 p-3 ${colClass[Math.min(group.length, 3) - 1]}`}
              style={{ width: `${100 / slides.length}%` }}
            >
              {group.map((g) => (
                <GameCard key={g._id} game={g} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="flex items-center justify-between px-3 pt-1 pb-2">
          <span className="font-mono text-[9px] tracking-widest text-white/25">
            {slide + 1} / {slides.length}
          </span>
          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-[3px] rounded-full border-none p-0 transition-all duration-300 ${
                  i === slide ? "w-7 bg-[#C9974A]" : "w-4 bg-[#1F1F1F]"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between border-b border-white/3 py-1.5 last:border-none">
      <span className="text-[11px] text-white/45">{label}</span>
      <span className="font-mono text-[11px] font-medium text-[#C9974A]">{value}</span>
    </div>
  );
}

function HistoryItem({ item }: { item: BonusHuntHistoryItem }) {
  const pnl = item.stats.profitLoss;
  return (
    <div className="mb-1.5 rounded-lg border border-white/6 bg-[#181818] p-2.5">
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] font-medium text-[#F0EDE8]">{item.hunt.title}</p>
        <p className="font-mono text-xs font-medium text-[#E8B96A]">${fmt(item.stats.totalWinnings)}</p>
      </div>
      {pnl != null && (
        <p className={`mt-0.5 font-mono text-[9px] ${pnl >= 0 ? "text-[#4CAF7D]" : "text-[#C42B2B]"}`}>
          {fmtPnL(pnl)} p&l
        </p>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BonusHuntWidgetPage() {
  const [current, setCurrent] = useState<BonusHuntView>(EMPTY_VIEW);
  const [history, setHistory] = useState<BonusHuntHistoryItem[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [currentRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/api/bonus-hunts/current`),
        fetch(`${API_BASE}/api/bonus-hunts/history`),
      ]);
      const currentData = (await currentRes.json()) as BonusHuntView;
      const historyData = (await historyRes.json()) as { history?: BonusHuntHistoryItem[] };
      setCurrent({ ...EMPTY_VIEW, ...currentData });
      setHistory(historyData.history || []);
    } catch (err) {
      console.error("Bonus hunt widget load failed:", err);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = window.setInterval(loadData, 5000);
    return () => window.clearInterval(interval);
  }, [loadData]);

  const { hunt, stats, games } = current;

  const statusLabel = useMemo(() => {
    if (!hunt) return "—";
    return STATUS_LABEL[hunt.status] ?? "—";
  }, [hunt]);

  const statusClass = useMemo(() => {
    if (hunt?.status === "ongoing")
      return "border-[#4CAF7D]/30 bg-[#4CAF7D]/10 text-[#4CAF7D]";
    if (hunt?.status === "draft")
      return "border-[#C9974A]/30 bg-[#C9974A]/10 text-[#C9974A]";
    return "border-[#C42B2B]/35 bg-[#C42B2B]/15 text-[#E87070]";
  }, [hunt]);

  const pnl = stats?.profitLoss ?? null;
  const pnlPositive = pnl != null && pnl >= 0;

  const snapRows: [string, string | number][] = [
    ["Completed", stats?.completedGames ?? "—"],
    ["Remaining", stats?.remainingGames ?? "—"],
    ["Done bets", stats ? `$${fmt(stats.completedBetTotal)}` : "—"],
    ["Start cost", hunt ? `$${fmt(hunt.startCost)}` : "—"],
    ["Target", hunt ? `$${fmt(hunt.targetProfit)}` : "—"],
  ];

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{
        background: "#080808",
        fontFamily: "'DM Sans', sans-serif",
        color: "#F0EDE8",
      }}
    >
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; overflow: hidden; }
        .font-display { font-family: 'Bebas Neue', sans-serif; }
        .font-mono { font-family: 'DM Mono', monospace; }
      `}</style>

      {/* Top bar */}
      <header
        className="flex items-stretch flex-shrink-0 border-b"
        style={{ background: "#111", borderColor: "rgba(201,151,74,0.12)" }}
      >
        {/* Brand */}
        <div
          className="flex flex-col justify-center px-5 py-3.5 border-r"
          style={{ borderColor: "rgba(201,151,74,0.12)", minWidth: 0 }}
        >
          <p
            className="font-mono text-[9px] uppercase tracking-[.35em]"
            style={{ color: "rgba(255,255,255,0.35)", marginBottom: 4 }}
          >
            Live tracker
          </p>
          <p className="font-display text-[22px] leading-none tracking-wide" style={{ color: "#E8B96A" }}>
            Bonus Hunt
          </p>
        </div>

        {/* Stats strip */}
        <div className="flex flex-1 overflow-hidden">
          {[
            {
              label: "Hunt",
              value: hunt?.title ?? "No active hunt",
              mono: false,
              cls: "text-[13px] font-semibold text-[#F0EDE8]",
            },
            {
              label: "Winnings",
              value: stats ? `$${fmt(stats.totalWinnings)}` : "—",
              mono: true,
              cls: "font-display text-[20px] tracking-wide text-[#F0EDE8]",
            },
            {
              label: "P&L",
              value: fmtPnL(pnl),
              mono: true,
              cls: `font-display text-[20px] tracking-wide ${pnl == null ? "text-[#F0EDE8]" : pnlPositive ? "text-[#4CAF7D]" : "text-[#C42B2B]"}`,
            },
            {
              label: "Games",
              value: stats ? `${stats.completedGames}/${stats.totalGames}` : "0/0",
              mono: true,
              cls: "font-display text-[20px] tracking-wide text-[#F0EDE8]",
            },
          ].map(({ label, value, mono, cls }) => (
            <div
              key={label}
              className="flex flex-1 flex-col justify-center border-r px-4 py-2.5"
              style={{ borderColor: "rgba(201,151,74,0.12)" }}
            >
              <p
                className="font-mono text-[9px] uppercase tracking-[.3em]"
                style={{ color: "rgba(255,255,255,0.35)", marginBottom: 3 }}
              >
                {label}
              </p>
              <p className={cls} style={mono ? { fontFamily: "'Bebas Neue', sans-serif" } : {}}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Status badge */}
        <div className="flex items-center px-5">
          <span
            className={`rounded-sm border px-3.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[.2em] ${statusClass}`}
          >
            {statusLabel}
          </span>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main area */}
        <div
          className="flex flex-col flex-1 overflow-hidden border-r"
          style={{ borderColor: "rgba(201,151,74,0.12)" }}
        >
          {/* Progress bar */}
          <div
            className="flex-shrink-0 px-4 py-3 border-b"
            style={{ background: "#111", borderColor: "rgba(201,151,74,0.12)" }}
          >
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="font-display text-[15px] tracking-widest" style={{ color: "#C9974A" }}>
                {hunt?.title ?? "Progress"}
              </span>
              <span className="font-mono text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                {stats ? `${Math.round(stats.progressPercent)}%` : "0%"}
              </span>
            </div>
            <div className="h-[3px] overflow-hidden rounded-full" style={{ background: "#1F1F1F" }}>
              <div
                className="h-full transition-all duration-700 rounded-full"
                style={{
                  width: `${stats ? Math.round(stats.progressPercent) : 0}%`,
                  background: "linear-gradient(90deg, #8B1A1A, #C9974A)",
                }}
              />
            </div>
          </div>

          {/* Metric cards */}
          <div
            className="grid flex-shrink-0 border-b"
            style={{
              gridTemplateColumns: "repeat(4, 1fr)",
              borderColor: "rgba(201,151,74,0.12)",
            }}
          >
            {[
              { label: "Run Avg", value: fmtX(stats?.runAvgX) },
              { label: "Req Avg", value: fmtX(stats?.reqAvgTargetX ?? stats?.reqAvgBreakEvenX) },
              { label: "Break-even", value: fmtX(stats?.reqAvgBreakEvenX) },
              { label: "Bet total", value: stats ? `$${fmt(stats.plannedBetTotal)}` : "—" },
            ].map(({ label, value }, i) => (
              <div
                key={label}
                className="border-r px-3.5 py-3 last:border-none"
                style={{ background: "#080808", borderColor: "rgba(201,151,74,0.12)" }}
              >
                <p
                  className="font-mono text-[9px] uppercase tracking-[.25em]"
                  style={{ color: "rgba(255,255,255,0.25)", marginBottom: 5 }}
                >
                  {label}
                </p>
                <p className="font-display text-[22px] leading-none tracking-wider" style={{ color: "#E8B96A" }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Carousel */}
          <Carousel games={games} />
        </div>

        {/* Sidebar */}
        <aside
          className="flex w-[220px] flex-shrink-0 flex-col overflow-hidden"
          style={{ background: "#111" }}
        >
          {/* Snapshot */}
          <div className="flex-shrink-0 border-b px-4 py-3.5" style={{ borderColor: "rgba(201,151,74,0.12)" }}>
            <p
              className="font-mono text-[9px] uppercase tracking-[.3em]"
              style={{ color: "rgba(255,255,255,0.25)", marginBottom: 10 }}
            >
              Snapshot
            </p>
            {snapRows.map(([label, value]) => (
              <SidebarRow key={label} label={label} value={value} />
            ))}
          </div>

          {/* History */}
          <div className="flex-1 overflow-y-auto px-4 py-3.5">
            <p
              className="font-mono text-[9px] uppercase tracking-[.3em]"
              style={{ color: "rgba(255,255,255,0.25)", marginBottom: 10 }}
            >
              History
            </p>
            {history.length > 0 ? (
              history.slice(0, 8).map((item) => (
                <HistoryItem key={item.hunt._id} item={item} />
              ))
            ) : (
              <p className="font-mono text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                No finished hunts yet.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}