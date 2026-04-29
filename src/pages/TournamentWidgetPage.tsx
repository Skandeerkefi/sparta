import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE } from "@/lib/api";

type TournamentStatus = "upcoming" | "ongoing" | "finished";

interface TournamentSummary {
  _id: string;
  title: string;
  playerLimit: number;
  prizePool: number;
  status: TournamentStatus;
  currentRound: number;
}

interface SlotSelection {
  roundIndex: number;
  slotId: string;
  slotName: string;
  provider?: string;
  image?: string;
  url?: string;
}

interface TournamentPlayer {
  _id: string;
  username: string;
  position: number;
  currentRound: number;
  status: "active" | "eliminated" | "winner";
  slotSelections: SlotSelection[];
}

interface TournamentMatch {
  _id: string;
  roundIndex: number;
  matchIndex: number;
  roundLabel: string;
  status: "waiting" | "ready" | "completed";
  playerA: TournamentPlayer | null;
  playerB: TournamentPlayer | null;
  multiplierA: number | null;
  multiplierB: number | null;
  winner: TournamentPlayer | null;
}

interface TournamentState {
  tournament: TournamentSummary | null;
  matches: TournamentMatch[];
  players: TournamentPlayer[];
  availablePositions: number[];
  totalRounds: number;
}

const EMPTY_STATE: TournamentState = {
  tournament: null,
  matches: [],
  players: [],
  availablePositions: [],
  totalRounds: 0,
};

const formatMultiplier = (value: number | null) =>
  value === null || Number.isNaN(Number(value)) ? "—" : Number(value).toFixed(2);

export default function TournamentWidgetPage() {
  const [state, setState] = useState<TournamentState>(EMPTY_STATE);

  const loadState = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/tournaments/current`);
      const data = await response.json();
      setState({ ...EMPTY_STATE, ...data });
    } catch (error) {
      console.error("Tournament widget load failed:", error);
    }
  }, []);

  useEffect(() => {
    loadState();
    const interval = window.setInterval(loadState, 5000);
    return () => window.clearInterval(interval);
  }, [loadState]);

  const groupedMatches = useMemo(() => {
    const grouped: Record<number, TournamentMatch[]> = {};
    state.matches.forEach((match) => {
      if (!grouped[match.roundIndex]) grouped[match.roundIndex] = [];
      grouped[match.roundIndex].push(match);
    });

    return Object.entries(grouped)
      .map(([roundIndex, matches]) => ({
        roundIndex: Number(roundIndex),
        roundLabel: matches[0]?.roundLabel || `Round ${Number(roundIndex) + 1}`,
        matches: [...matches].sort((a, b) => a.matchIndex - b.matchIndex),
      }))
      .sort((a, b) => a.roundIndex - b.roundIndex);
  }, [state.matches]);

  const tournament = state.tournament;
  const currentStatus = tournament?.status || "upcoming";
  const completedMatches = state.matches.filter((match) => match.status === "completed").length;

  return (
    <div className='relative min-h-screen overflow-hidden bg-[#090302] text-white'>
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(201,137,88,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(147,2,3,0.22),_transparent_30%),linear-gradient(180deg,_rgba(15,6,4,0.96),_rgba(9,3,2,0.98))]' />
      <div className='pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-screen [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:48px_48px]' />

      <main className='relative z-10 mx-auto flex min-h-screen w-full max-w-[1920px] flex-col px-6 py-6 xl:px-10'>
        <header className='flex flex-col gap-4 rounded-[2rem] border border-[#C98958]/20 bg-black/35 px-6 py-5 shadow-2xl shadow-black/40 backdrop-blur-md xl:flex-row xl:items-end xl:justify-between'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.4em] text-white/45'>Live OBS Widget</p>
            <h1 className='mt-2 text-3xl font-black tracking-tight text-white sm:text-5xl'>Tournament Brackets</h1>
            <p className='mt-2 max-w-3xl text-sm text-white/65 sm:text-base'>
              Stream-safe bracket view with live match status, winners, and slot selections.
            </p>
          </div>

          <div className='grid gap-3 sm:grid-cols-3 xl:grid-cols-1'>
            <StatPill label='Status' value={currentStatus} />
            <StatPill label='Players' value={`${state.players.length}/${tournament?.playerLimit || 0}`} />
            <StatPill label='Completed Matches' value={`${completedMatches}/${state.matches.length}`} />
          </div>
        </header>

        <section className='mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          <MetricCard label='Prize Pool' value={`$${Number(tournament?.prizePool || 0).toLocaleString()}`} />
          <MetricCard label='Current Round' value={tournament ? `${tournament.currentRound + 1}` : "—"} />
          <MetricCard label='Free Spots' value={`${state.availablePositions.length}`} />
          <MetricCard label='Total Rounds' value={`${state.totalRounds || 0}`} />
        </section>

        <section className='mt-6 flex-1 overflow-hidden rounded-[2rem] border border-[#C98958]/20 bg-[#120b0a]/80 p-5 shadow-2xl shadow-black/40 backdrop-blur-md'>
          {groupedMatches.length > 0 ? (
            <div className='grid gap-4 xl:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]'>
              {groupedMatches.map((round) => (
                <article key={round.roundIndex} className='rounded-3xl border border-[#C98958]/15 bg-black/25 p-4'>
                  <div className='mb-4 flex items-end justify-between gap-3'>
                    <div>
                      <p className='text-xs uppercase tracking-[0.35em] text-white/40'>Round {round.roundIndex + 1}</p>
                      <h2 className='mt-1 text-xl font-bold text-[#E7AC78]'>{round.roundLabel}</h2>
                    </div>
                    <span className='rounded-full border border-[#C98958]/20 bg-[#930203]/25 px-3 py-1 text-xs font-semibold text-[#E7AC78]'>
                      {round.matches.length} matches
                    </span>
                  </div>

                  <div className='space-y-3'>
                    {round.matches.map((match) => {
                      const selectionA = match.playerA?.slotSelections?.find((selection) => selection.roundIndex === match.roundIndex);
                      const selectionB = match.playerB?.slotSelections?.find((selection) => selection.roundIndex === match.roundIndex);
                      const winnerId = match.winner?._id;

                      return (
                        <div key={match._id} className='rounded-2xl border border-[#C98958]/15 bg-[#100705]/90 p-4'>
                          <div className='flex items-center justify-between gap-3'>
                            <div>
                              <p className='text-[0.65rem] uppercase tracking-[0.3em] text-white/40'>Match {match.matchIndex + 1}</p>
                            </div>
                            <MatchPill status={match.status} />
                          </div>

                          <div className='mt-3 space-y-2'>
                            <MatchLine
                              side='A'
                              playerName={match.playerA?.username}
                              slotName={selectionA?.slotName}
                              provider={selectionA?.provider}
                              winner={winnerId === match.playerA?._id}
                              score={match.multiplierA}
                            />
                            <MatchLine
                              side='B'
                              playerName={match.playerB?.username}
                              slotName={selectionB?.slotName}
                              provider={selectionB?.provider}
                              winner={winnerId === match.playerB?._id}
                              score={match.multiplierB}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className='flex min-h-[320px] items-center justify-center rounded-3xl border border-dashed border-[#C98958]/20 bg-black/20 p-8 text-center text-white/55'>
              No tournament bracket is available yet.
            </div>
          )}
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

function MatchPill({ status }: { status: TournamentMatch["status"] }) {
  const label = status === "completed" ? "Completed" : status === "ready" ? "Ready" : "Waiting";
  const className =
    status === "completed"
      ? "bg-[#C98958] text-white"
      : status === "ready"
        ? "bg-green-600 text-white"
        : "bg-[#2c2f48] text-white/70";

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}>{label}</span>;
}

function MatchLine({
  side,
  playerName,
  slotName,
  provider,
  winner,
  score,
}: {
  side: "A" | "B";
  playerName?: string;
  slotName?: string;
  provider?: string;
  winner?: boolean;
  score: number | null;
}) {
  return (
    <div className={`rounded-xl border px-3 py-2 ${winner ? "border-[#C98958] bg-[#930203]/25" : "border-[#C98958]/10 bg-black/25"}`}>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <p className='text-[0.65rem] uppercase tracking-[0.3em] text-white/40'>
            {side}: {playerName || "Bye (auto x0)"}
          </p>
          <p className='mt-1 text-sm font-semibold text-white'>{slotName || "No slot selected yet"}</p>
          <p className='text-xs text-white/45'>{provider || ""}</p>
        </div>
        <div className='text-right'>
          <p className='text-[0.65rem] uppercase tracking-[0.3em] text-white/40'>Multiplier</p>
          <p className='mt-1 text-lg font-black text-[#E7AC78]'>{formatMultiplier(score)}x</p>
        </div>
      </div>
    </div>
  );
}