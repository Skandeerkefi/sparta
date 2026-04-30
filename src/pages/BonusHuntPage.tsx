import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "@/lib/api";
import GraphicalBackground from "@/components/GraphicalBackground";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/store/useAuthStore";

type HuntStatus = "draft" | "ongoing" | "finished";

interface BonusHuntSummary {
  _id: string;
  title: string;
  startCost: number;
  targetProfit: number;
  status: HuntStatus;
  startedAt?: string | null;
  finishedAt?: string | null;
  createdAt?: string;
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
  playedAt?: string | null;
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

const emptyView: BonusHuntView = {
  hunt: null,
  games: [],
  stats: null,
};

const formatNumber = (value: number | null | undefined) =>
  value === null || value === undefined || Number.isNaN(Number(value))
    ? "—"
    : Number(value).toLocaleString();

const formatMultiplier = (value: number | null | undefined) =>
  value === null || value === undefined || Number.isNaN(Number(value))
    ? "—"
    : Number(value).toFixed(2);

function BonusHuntPage() {
  const { user } = useAuthStore();
  const [current, setCurrent] = useState<BonusHuntView>(emptyView);
  const [history, setHistory] = useState<BonusHuntHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      const [currentRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/api/bonus-hunts/current`),
        fetch(`${API_BASE}/api/bonus-hunts/history`),
      ]);

      const currentData = (await currentRes.json()) as BonusHuntView;
      const historyData = (await historyRes.json()) as { history?: BonusHuntHistoryItem[] };

      setCurrent({ ...emptyView, ...currentData });
      setHistory(historyData.history || []);
    } catch (error) {
      console.error("Bonus Hunt load failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const hunt = current.hunt;
  const stats = current.stats;

  const currentLabel = useMemo(() => {
    if (!hunt) return "No active hunt";
    if (hunt.status === "draft") return "Upcoming";
    if (hunt.status === "ongoing") return "Ongoing";
    return "Finished";
  }, [hunt]);

  return (
    <div className='relative flex min-h-screen flex-col overflow-x-hidden overflow-hidden text-white'>
      <GraphicalBackground />
      <Navbar />

      <main className='relative z-10 flex-grow px-4 py-8 sm:px-6 lg:px-8'>
        <section className='mx-auto w-full max-w-7xl space-y-6'>
          <div className='overflow-hidden rounded-[2rem] border border-[#C98958]/25 bg-black/60 shadow-2xl shadow-black/40 backdrop-blur-md'>
            <div className='border-b border-[#C98958]/20 bg-gradient-to-r from-[#930203] to-[#C98958]/70 px-6 py-8 sm:px-10'>
              <p className='text-xs font-semibold uppercase tracking-[0.35em] text-white/75'>Bonus Hunt</p>
              <div className='mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
                <div>
                  <h1 className='text-3xl font-black tracking-tight text-white sm:text-5xl'>Live Bonus Hunt Tracker</h1>
                  <p className='mt-3 max-w-3xl text-sm text-white/85 sm:text-base'>
                    Follow the current bonus hunt from start cost to final payout, with every game, multiplier, and result updated live.
                  </p>
                </div>

                <div className='flex flex-wrap gap-2'>
                  <Badge className='bg-[#120b0a] text-[#E7AC78] border border-[#C98958]/30'>{currentLabel}</Badge>
                  {hunt && (
                    <Badge className='bg-[#120b0a] text-[#E7AC78] border border-[#C98958]/30'>
                      Start Cost {formatNumber(hunt.startCost)}$
                    </Badge>
                  )}
                  {stats && (
                    <Badge className='bg-[#120b0a] text-[#E7AC78] border border-[#C98958]/30'>
                      {stats.completedGames}/{stats.totalGames} Games
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className='grid gap-4 border-b border-[#C98958]/15 px-6 py-6 sm:grid-cols-2 xl:grid-cols-4 sm:px-10'>
              <StatCard label='Total Winnings' value={stats ? `${formatNumber(stats.totalWinnings)}$` : "—"} />
              <StatCard label='P&L vs Start Cost' value={stats ? `${stats.profitLoss >= 0 ? "+" : ""}${formatNumber(stats.profitLoss)}$` : "—"} />
              <StatCard label='Run Avg X' value={stats ? formatMultiplier(stats.runAvgX) : "—"} />
              <StatCard label='Req Avg X' value={stats ? formatMultiplier(stats.reqAvgTargetX ?? stats.reqAvgBreakEvenX) : "—"} />
            </div>

            <div className='grid gap-6 px-6 py-6 lg:grid-cols-[1.5fr_0.9fr] lg:px-10 lg:py-10'>
              <section className='space-y-6'>
                <Card className='border-[#C98958]/20 bg-[#120b0a]/80 text-white shadow-lg shadow-black/30'>
                  <CardContent className='p-5 sm:p-6'>
                    <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
                      <div>
                        <h2 className='text-xl font-bold text-white'>Current Hunt Overview</h2>
                        <p className='mt-1 text-sm text-white/50'>Real-time progress and performance snapshot.</p>
                      </div>

                      {stats && (
                        <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
                          <TinyStat label='Completed' value={stats.completedGames} />
                          <TinyStat label='Remaining' value={stats.remainingGames} />
                          <TinyStat label='Progress' value={`${stats.progressPercent}%`} />
                          <TinyStat label='Bet Total' value={`${formatNumber(stats.plannedBetTotal)}$`} />
                        </div>
                      )}
                    </div>

                    {hunt ? (
                      <div className='mt-5 space-y-4'>
                        <div className='rounded-2xl border border-[#C98958]/20 bg-black/25 p-4'>
                          <div className='flex flex-wrap items-center justify-between gap-3'>
                            <div>
                              <p className='text-xs uppercase tracking-[0.25em] text-white/45'>Current Hunt</p>
                              <h3 className='mt-1 text-2xl font-black text-[#E7AC78]'>{hunt.title}</h3>
                            </div>
                            <Badge className='bg-[#930203] text-white'>{hunt.status}</Badge>
                          </div>

                          <div className='mt-4 h-2 overflow-hidden rounded-full bg-black/30'>
                            <div
                              className='h-full rounded-full bg-gradient-to-r from-[#930203] to-[#C98958]'
                              style={{ width: `${stats?.progressPercent || 0}%` }}
                            />
                          </div>
                        </div>

                        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
                          {current.games.length > 0 ? (
                            current.games.map((game) => (
                              <Card key={game._id} className='border-[#C98958]/15 bg-black/25 text-white'>
                                <CardContent className='p-0'>
                                  {game.image ? (
                                    <img src={game.image} alt={game.slotName} className='h-40 w-full object-cover' />
                                  ) : (
                                    <div className='flex h-40 items-center justify-center bg-black/30 text-sm text-white/35'>
                                      No image available
                                    </div>
                                  )}
                                  <div className='space-y-2 p-4'>
                                    <div className='flex items-start justify-between gap-3'>
                                      <div>
                                        <h4 className='font-bold text-white'>{game.slotName}</h4>
                                        <p className='text-xs text-white/45'>{game.provider || "Provider unknown"}</p>
                                      </div>
                                      <Badge className={game.bonusType === "super" ? "bg-[#C98958] text-white" : "bg-[#2c2f48] text-white"}>
                                        {game.bonusType}
                                      </Badge>
                                    </div>

                                    <p className='text-sm text-white/60'>Bet: {formatNumber(game.betSize)}$</p>
                                    {game.note && <p className='text-sm text-white/50'>{game.note}</p>}

                                    <div className='rounded-xl border border-[#C98958]/15 bg-black/30 px-3 py-2 text-sm'>
                                      <div className='flex items-center justify-between'>
                                        <span className='text-white/50'>Payout</span>
                                        <span className='font-semibold text-[#E7AC78]'>
                                          {game.status === "completed" ? `${formatNumber(game.payout)}$` : "Pending"}
                                        </span>
                                      </div>
                                      <div className='mt-1 flex items-center justify-between'>
                                        <span className='text-white/50'>Multiplier</span>
                                        <span className='font-semibold text-[#E7AC78]'>x{formatMultiplier(game.multiplier)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          ) : (
                            <div className='rounded-2xl border border-dashed border-[#C98958]/25 bg-black/25 p-6 text-sm text-white/50'>
                              No games added yet.
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className='mt-6 rounded-2xl border border-dashed border-[#C98958]/25 bg-black/25 p-6 text-sm text-white/50'>
                        No bonus hunt is active right now. Check history below for past hunts.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>

              <aside className='space-y-6'>
                <Card className='border-[#C98958]/20 bg-[#120b0a]/80 text-white shadow-lg shadow-black/30'>
                  <CardContent className='p-5 sm:p-6'>
                    <h2 className='text-xl font-bold text-white'>Performance Dashboard</h2>
                    <p className='mt-1 text-sm text-white/50'>Global stats for the current hunt.</p>

                    {stats ? (
                      <div className='mt-4 space-y-3'>
                        <DashboardRow label='Total Games' value={stats.totalGames} />
                        <DashboardRow label='Completed' value={stats.completedGames} />
                        <DashboardRow label='Remaining' value={stats.remainingGames} />
                        <DashboardRow label='Completed Bet Total' value={`${formatNumber(stats.completedBetTotal)}$`} />
                        <DashboardRow label='Run Avg X' value={formatMultiplier(stats.runAvgX)} />
                        <DashboardRow label='Break-even Req Avg X' value={formatMultiplier(stats.reqAvgBreakEvenX)} />
                        {stats.reqAvgTargetX !== null && (
                          <DashboardRow label='Target Req Avg X' value={formatMultiplier(stats.reqAvgTargetX)} />
                        )}
                      </div>
                    ) : (
                      <p className='mt-4 text-sm text-white/45'>Stats will appear when a hunt is created.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className='border-[#C98958]/20 bg-[#120b0a]/80 text-white shadow-lg shadow-black/30'>
                  <CardContent className='p-5 sm:p-6'>
                    <h2 className='text-xl font-bold text-white'>History</h2>
                    <p className='mt-1 text-sm text-white/50'>Completed hunts and their results.</p>

                    <div className='mt-4 space-y-3'>
                      {history.length > 0 ? (
                        history.map((item) => (
                          <details key={item.hunt._id} className='rounded-2xl border border-[#C98958]/15 bg-black/25 p-4'>
                            <summary className='cursor-pointer list-none'>
                              <div className='flex items-center justify-between gap-3'>
                                <div>
                                  <p className='font-semibold text-white'>{item.hunt.title}</p>
                                  <p className='text-xs text-white/45'>Finished {item.hunt.finishedAt ? new Date(item.hunt.finishedAt).toLocaleString() : "recently"}</p>
                                </div>
                                <Badge className='bg-[#C98958] text-white'>
                                  {formatNumber(item.stats.totalWinnings)}$
                                </Badge>
                              </div>
                            </summary>

                            <div className='mt-4 space-y-2 text-sm'>
                              <HistoryRow label='P&L' value={`${item.stats.profitLoss >= 0 ? "+" : ""}${formatNumber(item.stats.profitLoss)}$`} />
                              <HistoryRow label='Run Avg X' value={formatMultiplier(item.stats.runAvgX)} />
                              <HistoryRow label='Games' value={`${item.stats.completedGames}/${item.stats.totalGames}`} />
                              <div className='mt-3 space-y-2'>
                                {item.games.map((game) => (
                                  <div key={game._id} className='rounded-xl border border-[#C98958]/10 bg-black/20 px-3 py-2'>
                                    <div className='flex items-center justify-between gap-3'>
                                      <span className='font-medium text-white'>{game.slotName}</span>
                                      <span className='text-[#E7AC78]'>x{formatMultiplier(game.multiplier)}</span>
                                    </div>
                                    <p className='text-xs text-white/45'>Payout {formatNumber(game.payout)}$</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </details>
                        ))
                      ) : (
                        <p className='text-sm text-white/45'>No finished hunts yet.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {user?.role === "admin" && (
                  <div className='rounded-3xl border border-[#C98958]/20 bg-[#120b0a]/80 p-5 shadow-lg shadow-black/30'>
                    <p className='text-sm text-white/50'>Admins can manage the hunt start-to-finish from the control panel.</p>
                    <div className='mt-4'>
                      <Link to='/bonus-hunt/admin' className='inline-flex w-full items-center justify-center rounded-xl bg-[#C98958] px-4 py-3 font-semibold text-white transition hover:bg-[#930203]'>
                        Admin Panel
                      </Link>
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-2xl border border-[#C98958]/20 bg-black/30 p-4'>
      <p className='text-xs uppercase tracking-[0.25em] text-white/45'>{label}</p>
      <p className='mt-2 text-2xl font-bold text-[#E7AC78]'>{value}</p>
    </div>
  );
}

function TinyStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className='rounded-xl border border-[#C98958]/15 bg-black/25 px-3 py-2'>
      <p className='text-[0.65rem] uppercase tracking-[0.2em] text-white/40'>{label}</p>
      <p className='mt-1 text-sm font-semibold text-white'>{value}</p>
    </div>
  );
}

function DashboardRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className='flex items-center justify-between rounded-xl border border-[#C98958]/10 bg-black/25 px-3 py-2 text-sm'>
      <span className='text-white/55'>{label}</span>
      <span className='font-semibold text-[#E7AC78]'>{value}</span>
    </div>
  );
}

function HistoryRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className='flex items-center justify-between rounded-xl border border-[#C98958]/10 bg-black/25 px-3 py-2'>
      <span className='text-white/55'>{label}</span>
      <span className='font-semibold text-[#E7AC78]'>{value}</span>
    </div>
  );
}

export default BonusHuntPage;
