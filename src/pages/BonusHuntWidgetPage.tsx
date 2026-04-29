import { useCallback, useEffect, useMemo, useState } from "react";
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

const EMPTY_VIEW: BonusHuntView = {
  hunt: null,
  games: [],
  stats: null,
};

const formatNumber = (value: number | null | undefined) =>
  value === null || value === undefined || Number.isNaN(Number(value)) ? "—" : Number(value).toLocaleString();

const formatMultiplier = (value: number | null | undefined) =>
  value === null || value === undefined || Number.isNaN(Number(value)) ? "—" : Number(value).toFixed(2);

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
    } catch (error) {
      console.error("Bonus hunt widget load failed:", error);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = window.setInterval(loadData, 5000);
    return () => window.clearInterval(interval);
  }, [loadData]);

  const hunt = current.hunt;
  const stats = current.stats;

  const currentLabel = useMemo(() => {
    if (!hunt) return "No active hunt";
    if (hunt.status === "draft") return "Upcoming";
    if (hunt.status === "ongoing") return "Live";
    return "Finished";
  }, [hunt]);

  return (
    <div className='relative min-h-screen overflow-hidden bg-[#090302] text-white'>
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(201,137,88,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(147,2,3,0.22),_transparent_30%),linear-gradient(180deg,_rgba(15,6,4,0.96),_rgba(9,3,2,0.98))]' />
      <div className='pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-screen [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:48px_48px]' />

      <main className='relative z-10 mx-auto flex min-h-screen w-full max-w-[1920px] flex-col px-6 py-6 xl:px-10'>
        <header className='flex flex-col gap-4 rounded-[2rem] border border-[#C98958]/20 bg-black/35 px-6 py-5 shadow-2xl shadow-black/40 backdrop-blur-md xl:flex-row xl:items-end xl:justify-between'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.4em] text-white/45'>Live OBS Widget</p>
            <h1 className='mt-2 text-3xl font-black tracking-tight text-white sm:text-5xl'>Bonus Hunt Tracker</h1>
            <p className='max-w-3xl mt-2 text-sm text-white/65 sm:text-base'>
              Compact live hunt view with winnings, progress, and every slot card updated in real time.
            </p>
          </div>

          <div className='grid gap-3 sm:grid-cols-3 xl:grid-cols-1'>
            <StatPill label='Status' value={currentLabel} />
            <StatPill label='Games' value={`${stats?.completedGames || 0}/${stats?.totalGames || 0}`} />
            <StatPill label='Progress' value={`${stats?.progressPercent || 0}%`} />
          </div>
        </header>

        <section className='grid gap-4 mt-6 sm:grid-cols-2 xl:grid-cols-4'>
          <MetricCard label='Total Winnings' value={`$${formatNumber(stats?.totalWinnings)}`} />
          <MetricCard label='P&L' value={`${(stats?.profitLoss || 0) >= 0 ? "+" : ""}$${formatNumber(stats?.profitLoss)}`} />
          <MetricCard label='Run Avg X' value={formatMultiplier(stats?.runAvgX)} />
          <MetricCard label='Req Avg X' value={formatMultiplier(stats?.reqAvgTargetX ?? stats?.reqAvgBreakEvenX)} />
        </section>

        <section className='mt-6 grid flex-1 gap-6 xl:grid-cols-[1.45fr_0.95fr]'>
          <div className='rounded-[2rem] border border-[#C98958]/20 bg-[#120b0a]/80 p-5 shadow-2xl shadow-black/40 backdrop-blur-md'>
            <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
              <div>
                <h2 className='text-xl font-bold text-white'>Current Hunt Overview</h2>
                <p className='mt-1 text-sm text-white/50'>Live progress and slot cards shown as the hunt updates.</p>
              </div>

              {stats && (
                <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
                  <TinyStat label='Completed' value={stats.completedGames} />
                  <TinyStat label='Remaining' value={stats.remainingGames} />
                  <TinyStat label='Bet Total' value={`$${formatNumber(stats.plannedBetTotal)}`} />
                  <TinyStat label='Start Cost' value={`$${formatNumber(hunt?.startCost)}`} />
                </div>
              )}
            </div>

            {hunt ? (
              <div className='mt-5 space-y-4'>
                <div className='rounded-3xl border border-[#C98958]/20 bg-black/25 p-4'>
                  <div className='flex flex-wrap items-center justify-between gap-3'>
                    <div>
                      <p className='text-xs uppercase tracking-[0.25em] text-white/45'>Current Hunt</p>
                      <h3 className='mt-1 text-2xl font-black text-[#E7AC78]'>{hunt.title}</h3>
                    </div>
                    <span className='rounded-full border border-[#C98958]/20 bg-[#930203]/25 px-3 py-1 text-xs font-semibold text-[#E7AC78]'>
                      {currentLabel}
                    </span>
                  </div>

                  <div className='h-2 mt-4 overflow-hidden rounded-full bg-black/30'>
                    <div
                      className='h-full rounded-full bg-gradient-to-r from-[#930203] to-[#C98958]'
                      style={{ width: `${stats?.progressPercent || 0}%` }}
                    />
                  </div>
                </div>

                <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
                  {current.games.length > 0 ? (
                    current.games.map((game) => (
                      <article key={game._id} className='overflow-hidden rounded-3xl border border-[#C98958]/15 bg-black/25 text-white shadow-lg shadow-black/20'>
                        {game.image ? (
                          <img src={game.image} alt={game.slotName} className='object-cover w-full h-40' />
                        ) : (
                          <div className='flex items-center justify-center h-40 text-sm bg-black/30 text-white/35'>
                            No image available
                          </div>
                        )}

                        <div className='p-4 space-y-3'>
                          <div className='flex items-start justify-between gap-3'>
                            <div>
                              <h4 className='font-bold text-white'>{game.slotName}</h4>
                              <p className='text-xs text-white/45'>{game.provider || "Provider unknown"}</p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${game.bonusType === "super" ? "bg-[#C98958] text-white" : "bg-[#2c2f48] text-white"}`}>
                              {game.bonusType}
                            </span>
                          </div>

                          {game.note && <p className='text-sm text-white/55'>{game.note}</p>}

                          <div className='rounded-2xl border border-[#C98958]/15 bg-black/30 px-3 py-3 text-sm'>
                            <div className='flex items-center justify-between'>
                              <span className='text-white/50'>Bet</span>
                              <span className='font-semibold text-[#E7AC78]'>${formatNumber(game.betSize)}</span>
                            </div>
                            <div className='flex items-center justify-between mt-2'>
                              <span className='text-white/50'>Multiplier</span>
                              <span className='font-semibold text-[#E7AC78]'>x{formatMultiplier(game.multiplier)}</span>
                            </div>
                            <div className='flex items-center justify-between mt-2'>
                              <span className='text-white/50'>Payout</span>
                              <span className='font-semibold text-[#E7AC78]'>
                                {game.status === "completed" ? `$${formatNumber(game.payout)}` : "Pending"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className='rounded-3xl border border-dashed border-[#C98958]/25 bg-black/25 p-6 text-sm text-white/50'>
                      No games added yet.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className='mt-6 rounded-3xl border border-dashed border-[#C98958]/25 bg-black/25 p-6 text-sm text-white/50'>
                No bonus hunt is active right now.
              </div>
            )}
          </div>

          <aside className='space-y-6'>
            <div className='rounded-[2rem] border border-[#C98958]/20 bg-[#120b0a]/80 p-5 shadow-2xl shadow-black/40 backdrop-blur-md'>
              <h2 className='text-xl font-bold text-white'>Performance Snapshot</h2>
              <p className='mt-1 text-sm text-white/50'>Live calculations for the current hunt.</p>

              {stats ? (
                <div className='mt-4 space-y-3'>
                  <InfoRow label='Total Games' value={stats.totalGames} />
                  <InfoRow label='Completed' value={stats.completedGames} />
                  <InfoRow label='Remaining' value={stats.remainingGames} />
                  <InfoRow label='Completed Bet Total' value={`$${formatNumber(stats.completedBetTotal)}`} />
                  <InfoRow label='Run Avg X' value={formatMultiplier(stats.runAvgX)} />
                  <InfoRow label='Break-even Req Avg X' value={formatMultiplier(stats.reqAvgBreakEvenX)} />
                  {stats.reqAvgTargetX !== null && <InfoRow label='Target Req Avg X' value={formatMultiplier(stats.reqAvgTargetX)} />}
                </div>
              ) : (
                <p className='mt-4 text-sm text-white/45'>Stats will appear once a hunt is created.</p>
              )}
            </div>

            <div className='rounded-[2rem] border border-[#C98958]/20 bg-[#120b0a]/80 p-5 shadow-2xl shadow-black/40 backdrop-blur-md'>
              <h2 className='text-xl font-bold text-white'>History</h2>
              <p className='mt-1 text-sm text-white/50'>Completed hunts remain visible on the public page.</p>
              <div className='mt-4 space-y-3'>
                {history.length > 0 ? (
                  history.slice(0, 3).map((item) => (
                    <div key={item.hunt._id} className='rounded-2xl border border-[#C98958]/15 bg-black/25 p-4'>
                      <div className='flex items-center justify-between gap-3'>
                        <div>
                          <p className='font-semibold text-white'>{item.hunt.title}</p>
                          <p className='text-xs text-white/45'>Finished bonus hunt</p>
                        </div>
                        <span className='rounded-full border border-[#C98958]/20 bg-[#930203]/25 px-3 py-1 text-xs font-semibold text-[#E7AC78]'>
                          ${formatNumber(item.stats.totalWinnings)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className='text-sm text-white/45'>No finished hunts yet.</p>
                )}
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-2xl border border-[#C98958]/15 bg-black/30 px-4 py-3'>
      <p className='text-[0.6rem] uppercase tracking-[0.35em] text-white/40'>{label}</p>
      <p className='mt-1 text-lg font-bold text-[#E7AC78]'>{value}</p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-3xl border border-[#C98958]/15 bg-black/25 px-4 py-4 shadow-lg shadow-black/20'>
      <p className='text-xs uppercase tracking-[0.3em] text-white/40'>{label}</p>
      <p className='mt-2 text-2xl font-black text-white'>{value}</p>
    </div>
  );
}

function TinyStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className='rounded-2xl border border-[#C98958]/15 bg-black/25 px-3 py-2'>
      <p className='text-[0.6rem] uppercase tracking-[0.3em] text-white/40'>{label}</p>
      <p className='mt-1 text-sm font-semibold text-white'>{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className='flex items-center justify-between rounded-xl border border-[#C98958]/10 bg-black/25 px-3 py-2 text-sm'>
      <span className='text-white/55'>{label}</span>
      <span className='font-semibold text-[#E7AC78]'>{value}</span>
    </div>
  );
}