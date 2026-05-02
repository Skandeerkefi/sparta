import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE } from "@/lib/api";

/* ───────── TYPES ───────── */

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
  slotName: string;
  provider?: string;
  image?: string;
}

interface TournamentPlayer {
  _id: string;
  username: string;
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

const formatMultiplier = (v: number | null) =>
  v == null ? "—" : `${Number(v).toFixed(2)}x`;

/* ───────── MAIN ───────── */

export default function TournamentWidgetPage() {
  const [state, setState] = useState<TournamentState>(EMPTY_STATE);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/tournaments/current`);
      const data = await res.json();
      setState({ ...EMPTY_STATE, ...data });
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    load();
    const i = setInterval(load, 5000);
    return () => clearInterval(i);
  }, []);

  /* ───────── GET CURRENT MATCHUP ───────── */

  const currentMatchup = useMemo(() => {
    return state.matches.find((m) => m.status !== "completed") || null;
  }, [state.matches]);

  /* ───────── GET MATCH PROGRESS ───────── */

  const matchProgress = useMemo(() => {
    if (!currentMatchup) return { current: 0, total: 0, roundMatches: 0 };

    const currentRoundMatches = state.matches.filter(
      (m) => m.roundIndex === currentMatchup.roundIndex
    );
    const allMatchesBefore = state.matches.filter(
      (m) => m.roundIndex < currentMatchup.roundIndex || (m.roundIndex === currentMatchup.roundIndex && m.matchIndex < currentMatchup.matchIndex)
    );

    return {
      current: allMatchesBefore.length + 1,
      total: state.matches.length,
      roundMatches: currentRoundMatches.length,
      roundCurrent: currentRoundMatches.filter(m => m.matchIndex <= currentMatchup.matchIndex).length,
    };
  }, [currentMatchup, state.matches]);

  /* ───────── GROUP ROUNDS (FOR REFERENCE) ───────── */

  const rounds = useMemo(() => {
    const grouped: Record<number, TournamentMatch[]> = {};

    state.matches.forEach((m) => {
      if (!grouped[m.roundIndex]) grouped[m.roundIndex] = [];
      grouped[m.roundIndex].push(m);
    });

    return Object.entries(grouped)
      .map(([i, matches]) => ({
        roundIndex: Number(i),
        roundLabel: matches[0]?.roundLabel || `Round ${Number(i) + 1}`,
        matches: matches.sort((a, b) => a.matchIndex - b.matchIndex),
      }))
      .sort((a, b) => a.roundIndex - b.roundIndex);
  }, [state.matches]);

  const tournament = state.tournament;
  const completedMatches = state.matches.filter((m) => m.status === "completed").length;

  return (
    <div className="w-full h-screen overflow-hidden bg-gradient-to-br from-[#050505] to-[#0B0B0B] text-white flex flex-col p-8">

      {/* HEADER */}
      <div className="flex flex-col items-start justify-between gap-4 pb-5 mb-5 border-b xl:flex-row xl:items-center border-white/10">
        <div>
          <h1 className="text-4xl xl:text-5xl font-black text-[#E7AC78] tracking-wide">
            TOURNAMENT BRACKET
          </h1>
          <p className="mt-1 text-base text-white/40">
            OBS Live View
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <Stat label="Status" value={tournament?.status || "—"} />
          <Stat label="Players" value={`${state.players.length}/${tournament?.playerLimit || 0}`} />
          <Stat label="Done" value={`${completedMatches}/${state.matches.length}`} />
        </div>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
        <Metric label="Prize" value={`$${tournament?.prizePool || 0}`} />
        <Metric label="Round" value={`${(tournament?.currentRound ?? 0) + 1}`} />
        <Metric label="Spots" value={`${state.availablePositions.length}`} />
        <Metric label="Progress" value={`${matchProgress.current}/${matchProgress.total}`} />
      </div>

      {/* CURRENT MATCHUP (CENTERED) */}
      {currentMatchup ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-8">

          {/* ROUND LABEL */}
          <div className="mb-5 text-center">
            <p className="mb-3 text-2xl tracking-widest lg:text-3xl text-white/40">
              {currentMatchup.roundLabel}
            </p>
            <p className="text-xl lg:text-2xl text-white/60">
              Match {matchProgress.roundCurrent} of {matchProgress.roundMatches}
            </p>
          </div>

          {/* CURRENT MATCH - LARGE */}
          {(() => {
            const selectionA =
              currentMatchup.playerA?.slotSelections?.find(
                (s) => s.roundIndex === currentMatchup.roundIndex
              ) || currentMatchup.playerA?.slotSelections?.[0] || null;
            const selectionB =
              currentMatchup.playerB?.slotSelections?.find(
                (s) => s.roundIndex === currentMatchup.roundIndex
              ) || currentMatchup.playerB?.slotSelections?.[0] || null;

            const winnerId = currentMatchup.winner?._id;
            const isLive = currentMatchup.status === "ready";

            return (
              <div
                className={`rounded-3xl p-8 w-full max-w-[1400px] transition-all ${
                  isLive
                    ? "border-2 border-green-500 shadow-[0_0_18px_rgba(34,197,94,0.6)] bg-[#0E0605]"
                    : "border border-[#C98958]/20 bg-[#0E0605]"
                }`}
              >
                <div className="flex justify-between mb-6 text-xl lg:text-2xl text-white/40">
                  <span className="font-semibold">Match #{currentMatchup.matchIndex + 1}</span>
                  <MatchStatus status={currentMatchup.status} />
                </div>

                <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
                  <PlayerCardLarge
                    name={currentMatchup.playerA?.username}
                    slot={selectionA?.slotName}
                    provider={selectionA?.provider}
                    score={currentMatchup.multiplierA}
                    winner={winnerId === currentMatchup.playerA?._id}
                    image={selectionA?.image}
                  />

                  <div className="text-center text-3xl lg:text-4xl text-[#C98958] font-semibold">
                    VS
                  </div>

                  <PlayerCardLarge
                    name={currentMatchup.playerB?.username}
                    slot={selectionB?.slotName}
                    provider={selectionB?.provider}
                    score={currentMatchup.multiplierB}
                    winner={winnerId === currentMatchup.playerB?._id}
                    image={selectionB?.image}
                  />
                </div>
              </div>
            );
          })()}

        </div>
      ) : (
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <p className="text-3xl lg:text-4xl text-[#E7AC78] font-bold mb-5">Tournament Complete!</p>
            <p className="text-2xl lg:text-3xl text-white/60">All matches have been played.</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────── COMPONENTS ───────── */

function PlayerCardLarge({ name, slot, provider, score, winner, image }: any) {
  const isBye = !name;

  return (
    <div
      className={`p-6 rounded-3xl border mb-4 ${
        isBye
          ? "border-white/5 bg-black/10 opacity-40"
          : winner
          ? "border-[#E7AC78] bg-[#C98958]/20 shadow-[0_0_12px_rgba(231,172,120,0.5)]"
          : "border-white/10 bg-black/30"
      }`}
    >
      <div className="flex items-start gap-6">
        {/* SLOT IMAGE */}
        {image && (
          <div className="flex-shrink-0">
            <img
              src={image}
              alt={slot}
              className="object-cover w-32 h-32 border rounded border-white/10"
            />
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-2xl font-semibold lg:text-3xl">{name || "BYE"}</p>
              <p className="mt-1 text-lg text-white/40">{slot || "No slot"}</p>
              <p className="mt-1 text-sm text-white/30">{provider || ""}</p>
            </div>

            <div className="text-right">
              <p className="mb-2 text-base text-white/40">Multiplier</p>
              <p className="text-4xl lg:text-5xl font-bold text-[#E7AC78]">
                {formatMultiplier(score)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerCard({ name, slot, provider, score, winner }: any) {
  const isBye = !name;

  return (
    <div
      className={`p-2 rounded border ${
        isBye
          ? "border-white/5 bg-black/10 opacity-40"
          : winner
          ? "border-[#E7AC78] bg-[#C98958]/20 shadow-[0_0_6px_rgba(231,172,120,0.4)]"
          : "border-white/10 bg-black/30"
      }`}
    >
      <div className="flex justify-between">
        <div>
          <p className="text-xs font-semibold">{name || "BYE"}</p>
          <p className="text-[9px] text-white/40">{slot || "No slot"}</p>
          <p className="text-[8px] text-white/30">{provider || ""}</p>
        </div>

        <div className="text-right">
          <p className="text-[8px] text-white/40">X</p>
          <p className="text-sm text-[#E7AC78] font-bold">
            {formatMultiplier(score)}
          </p>
        </div>
      </div>
    </div>
  );
}

function MatchStatus({ status }: { status: string }) {
  const map: any = {
    completed: "bg-[#C98958]",
    ready: "bg-green-500",
    waiting: "bg-gray-600",
  };

  return (
    <span className={`px-3 py-1 rounded text-sm font-semibold ${map[status]}`}>
      {status.toUpperCase()}
    </span>
  );
}

function Stat({ label, value }: any) {
  return (
    <div className="px-3 py-2 border rounded bg-white/5 border-white/10">
      <p className="text-sm text-white/40">{label}</p>
      <p className="text-lg font-bold text-[#E7AC78]">{value}</p>
    </div>
  );
}

function Metric({ label, value }: any) {
  return (
    <div className="p-3 border rounded bg-black/30 border-white/10">
      <p className="text-sm text-white/40">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}