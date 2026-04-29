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

  /* ───────── GROUP ROUNDS ───────── */

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
    <div className="w-full h-screen overflow-hidden bg-gradient-to-br from-[#050505] to-[#0B0B0B] text-white flex flex-col p-3">

      {/* HEADER */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
        <div>
          <h1 className="text-xl font-black text-[#E7AC78] tracking-wide">
            TOURNAMENT BRACKET
          </h1>
          <p className="text-[10px] text-white/40">
            OBS Live View
          </p>
        </div>

        <div className="flex gap-2">
          <Stat label="Status" value={tournament?.status || "—"} />
          <Stat label="Players" value={`${state.players.length}/${tournament?.playerLimit || 0}`} />
          <Stat label="Done" value={`${completedMatches}/${state.matches.length}`} />
        </div>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <Metric label="Prize" value={`$${tournament?.prizePool || 0}`} />
        <Metric label="Round" value={`${(tournament?.currentRound ?? 0) + 1}`} />
        <Metric label="Spots" value={`${state.availablePositions.length}`} />
        <Metric label="Rounds" value={`${state.totalRounds}`} />
      </div>

      {/* BRACKET (NO SCROLL) */}
      <div className="flex items-center justify-center flex-1">

        <div
          className="grid w-full h-full gap-3"
          style={{
            gridTemplateColumns: `repeat(${rounds.length}, minmax(0, 1fr))`,
          }}
        >

          {rounds.map((round) => (
            <div key={round.roundIndex} className="flex flex-col items-center justify-center">

              {/* ROUND TITLE */}
              <div className="mb-2 text-center">
                <p className="text-[9px] text-white/40 tracking-widest">
                  ROUND {round.roundIndex + 1}
                </p>
                <h2 className="text-xs font-bold text-[#E7AC78]">
                  {round.roundLabel}
                </h2>
              </div>

              {/* MATCHES */}
              <div
                className="flex flex-col justify-center w-full gap-3"
                style={{ marginTop: round.roundIndex * 20 }}
              >
                {round.matches.map((match) => {
                  const selectionA = match.playerA?.slotSelections?.find(
                    (s) => s.roundIndex === match.roundIndex
                  );
                  const selectionB = match.playerB?.slotSelections?.find(
                    (s) => s.roundIndex === match.roundIndex
                  );

                  const winnerId = match.winner?._id;
                  const isLive = match.status === "ready";

                  return (
                    <div
                      key={match._id}
                      className={`rounded-lg p-2 w-full transition-all ${
                        isLive
                          ? "border border-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] bg-[#0E0605]"
                          : "border border-[#C98958]/20 bg-[#0E0605]"
                      }`}
                    >
                      <div className="flex justify-between text-[9px] text-white/40 mb-1">
                        <span>M{match.matchIndex + 1}</span>
                        <MatchStatus status={match.status} />
                      </div>

                      <PlayerCard
                        name={match.playerA?.username}
                        slot={selectionA?.slotName}
                        provider={selectionA?.provider}
                        score={match.multiplierA}
                        winner={winnerId === match.playerA?._id}
                      />

                      <div className="text-center text-[8px] text-[#C98958]/70 my-1">
                        VS
                      </div>

                      <PlayerCard
                        name={match.playerB?.username}
                        slot={selectionB?.slotName}
                        provider={selectionB?.provider}
                        score={match.multiplierB}
                        winner={winnerId === match.playerB?._id}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}

/* ───────── COMPONENTS ───────── */

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
    <span className={`px-2 py-0.5 rounded text-[8px] ${map[status]}`}>
      {status}
    </span>
  );
}

function Stat({ label, value }: any) {
  return (
    <div className="px-2 py-1 border rounded bg-white/5 border-white/10">
      <p className="text-[8px] text-white/40">{label}</p>
      <p className="text-[10px] font-bold text-[#E7AC78]">{value}</p>
    </div>
  );
}

function Metric({ label, value }: any) {
  return (
    <div className="p-2 border rounded bg-black/30 border-white/10">
      <p className="text-[8px] text-white/40">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}