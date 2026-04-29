import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API_BASE } from "@/lib/api";

/* ───────── TYPES ───────── */

type HuntStatus = "draft" | "ongoing" | "finished";

interface BonusHuntSummary {
  _id: string;
  title: string;
  startCost: number;
  targetProfit: number;
  status: HuntStatus;
}

interface BonusHuntGame {
  _id: string;
  slotName: string;
  provider?: string;
  image?: string;
  betSize: number;
  bonusType: "normal" | "super";
  payout: number | null;
  multiplier: number | null;
  status: "draft" | "completed";
}

interface BonusHuntStats {
  totalGames: number;
  completedGames: number;
  totalWinnings: number;
  profitLoss: number;
  runAvgX: number;
  reqAvgBreakEvenX: number;
  plannedBetTotal: number;
}

/* ───────── UTILS ───────── */

const fmt = (v: number | null | undefined) =>
  v == null ? "—" : v.toLocaleString();

const fmtX = (v: number | null | undefined) =>
  v == null ? "—" : `${v.toFixed(2)}x`;

const fmtPnL = (v: number | null | undefined) => {
  if (v == null) return "—";
  return v >= 0 ? `+$${fmt(v)}` : `-$${fmt(Math.abs(v))}`;
};

/* ───────── GAME CARD ───────── */

function GameCard({ game }: { game: BonusHuntGame }) {
  const done = game.status === "completed";

  return (
    <div className="flex rounded-xl bg-gradient-to-br from-[#111] to-[#0A0A0A] border border-white/5 overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.6)]">
      {/* IMAGE */}
      <div className="flex items-center justify-center w-24 bg-black/40">
        {game.image ? (
          <img
            src={game.image}
            className="object-contain w-full h-full p-1"
          />
        ) : (
          <span className="text-xs text-white/20">No Image</span>
        )}
      </div>

      {/* CONTENT */}
      <div className="flex flex-col flex-1 p-3">
        <div className="flex justify-between">
          <div>
            <p className="text-xs font-semibold text-white">
              {game.slotName}
            </p>
            <p className="text-[10px] text-white/40">
              {game.provider || "Unknown"}
            </p>
          </div>

          <span
            className={`text-[9px] px-2 py-[2px] rounded ${
              game.bonusType === "super"
                ? "bg-[#C9974A]/20 text-[#E8B96A]"
                : "bg-white/10 text-white/40"
            }`}
          >
            {game.bonusType}
          </span>
        </div>

        <div className="flex justify-between mt-2 text-xs">
          <span className="text-white/40">Bet</span>
          <span className="text-[#E8B96A]">${fmt(game.betSize)}</span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-white/40">Multi</span>
          <span className={done ? "text-[#E8B96A]" : "text-white/30"}>
            {done ? fmtX(game.multiplier) : "—"}
          </span>
        </div>

        <div className="flex justify-between mt-1 text-xs">
          <span className="text-white/40">Payout</span>
          <span className={done ? "text-[#E8B96A]" : "text-white/30"}>
            {done ? `$${fmt(game.payout)}` : "Pending"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ───────── VERTICAL CAROUSEL ───────── */

const CARDS_PER_SLIDE = 3;
const CYCLE_MS = 4000;

function Carousel({ games }: { games: BonusHuntGame[] }) {
  const [slide, setSlide] = useState(0);
  const timer = useRef<any>();

  const slides = useMemo(() => {
    const out = [];
    for (let i = 0; i < games.length; i += CARDS_PER_SLIDE) {
      out.push(games.slice(i, i + CARDS_PER_SLIDE));
    }
    return out;
  }, [games]);

  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    if (slides.length > 1) {
      timer.current = setInterval(
        () => setSlide((s) => (s + 1) % slides.length),
        CYCLE_MS
      );
    }
    return () => clearInterval(timer.current);
  }, [slides.length]);

  return (
    <div className="flex-1 overflow-hidden">
      <div
        className="flex flex-col transition-transform duration-500"
        style={{
          height: `${slides.length * 100}%`,
          transform: `translateY(-${(slide * 100) / slides.length}%)`,
        }}
      >
        {slides.map((group, i) => (
          <div
            key={i}
            className="grid gap-2 p-3"
            style={{ height: `${100 / slides.length}%` }}
          >
            {group.map((g) => (
              <GameCard key={g._id} game={g} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── MAIN ───────── */

export default function BonusHuntWidgetPage() {
  const [data, setData] = useState<any>({
    hunt: null,
    games: [],
    stats: null,
  });

  const load = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/bonus-hunts/current`);
    const json = await res.json();
    setData(json);
  }, []);

  useEffect(() => {
    load();
    const i = setInterval(load, 5000);
    return () => clearInterval(i);
  }, []);

  const { hunt, stats, games } = data;

  const pnl = stats?.profitLoss ?? null;
  const positive = pnl >= 0;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-[#050505] to-[#0B0B0B] text-white">
      
      {/* HEADER */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 backdrop-blur">
        <h1 className="text-[#E8B96A] text-lg tracking-wide">
          BONUS HUNT
        </h1>

        <span
          className={`text-xs px-3 py-1 rounded ${
            hunt?.status === "ongoing"
              ? "bg-green-500/20 text-green-400"
              : hunt?.status === "draft"
              ? "bg-yellow-500/20 text-yellow-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {hunt?.status || "—"}
        </span>
      </div>

      {/* STATS BAR */}
      <div className="grid grid-cols-4 gap-2 p-3">
        <Stat label="Winnings" value={`$${fmt(stats?.totalWinnings)}`} />
        <Stat label="P&L" value={fmtPnL(pnl)} highlight={positive} />
        <Stat label="Games" value={`${stats?.completedGames}/${stats?.totalGames}`} />
        <Stat label="Run Avg" value={fmtX(stats?.runAvgX)} />
      </div>

      {/* SECOND ROW */}
      <div className="grid grid-cols-3 gap-2 px-3 pb-3">
        <Stat label="Break-even" value={fmtX(stats?.reqAvgBreakEvenX)} />
        <Stat label="Bet Total" value={`$${fmt(stats?.plannedBetTotal)}`} />
        <Stat label="Target" value={`$${fmt(hunt?.targetProfit)}`} />
      </div>

      {/* CAROUSEL */}
      <Carousel games={games} />
    </div>
  );
}

/* ───────── STAT COMPONENT ───────── */

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="px-3 py-2 border rounded-lg bg-white/5 border-white/10 backdrop-blur">
      <p className="text-[10px] text-white/40 uppercase">{label}</p>
      <p
        className={`text-sm font-semibold ${
          highlight ? "text-green-400" : "text-[#E8B96A]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}