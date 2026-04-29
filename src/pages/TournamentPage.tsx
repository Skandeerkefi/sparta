import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "@/lib/api";
import GraphicalBackground from "@/components/GraphicalBackground";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import tournamentApi from "@/lib/tournamentApi";

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
  selectedAt?: string;
  locked?: boolean;
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
  betSizeA?: number | null;
  payoutA?: number | null;
  betSizeB?: number | null;
  payoutB?: number | null;
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

interface SlotSearchResult {
  slotName: string;
  provider?: string;
  image?: string;
  url?: string;
}

interface MatchInputState {
  betSizeA: string;
  payoutA: string;
  betSizeB: string;
  payoutB: string;
}

const EMPTY_STATE: TournamentState = {
  tournament: null,
  matches: [],
  players: [],
  availablePositions: [],
  totalRounds: 0,
};

const emptyMatchInput = (): MatchInputState => ({
  betSizeA: "",
  payoutA: "",
  betSizeB: "",
  payoutB: "",
});

const formatMultiplier = (value: number | null) =>
  value === null || Number.isNaN(Number(value)) ? "—" : Number(value).toLocaleString();

function TournamentPage() {
  const { user, token } = useAuthStore();
  const { toast } = useToast();
  const [state, setState] = useState<TournamentState>(EMPTY_STATE);
  const [myProgress, setMyProgress] = useState<TournamentPlayer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [slotQuery, setSlotQuery] = useState("");
  const [slotResults, setSlotResults] = useState<SlotSearchResult[]>([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [createTitle, setCreateTitle] = useState("Bethog Slot Tournament");
  const [createLimit, setCreateLimit] = useState("8");
  const [createPrizePool, setCreatePrizePool] = useState("0");
  const [isCreating, setIsCreating] = useState(false);
  const [matchInputs, setMatchInputs] = useState<Record<string, MatchInputState>>({});
  const [deletingParticipantId, setDeletingParticipantId] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";
  const currentRoundToPick = myProgress?.currentRound ?? null;

  const loadState = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/api/tournaments/current`);
      const data = await res.json();
      setState({ ...EMPTY_STATE, ...data });

      if (token && data?.tournament?._id) {
        const meRes = await fetch(`${API_BASE}/api/tournaments/${data.tournament._id}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const meData = await meRes.json();
        setMyProgress(meData.progress || null);
      } else {
        setMyProgress(null);
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to load tournament state.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    loadState();
    const interval = setInterval(loadState, 5000);
    return () => clearInterval(interval);
  }, [loadState]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!token || !state.tournament?._id || !slotQuery.trim() || !myProgress) {
        setSlotResults([]);
        return;
      }

      setSlotLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/api/tournaments/slots/search?q=${encodeURIComponent(slotQuery)}&site=Stake`
        );
        const data = await res.json();
        setSlotResults(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setSlotResults([]);
      } finally {
        setSlotLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [slotQuery, token, state.tournament?._id, myProgress]);

  useEffect(() => {
    const nextInputs: Record<string, MatchInputState> = {};
    state.matches.forEach((match) => {
      nextInputs[match._id] = matchInputs[match._id] || emptyMatchInput();
    });
    setMatchInputs(nextInputs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.matches]);

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

  const currentSelection = useMemo(() => {
    if (!myProgress || currentRoundToPick === null) return null;
    return myProgress.slotSelections.find((selection) => selection.roundIndex === currentRoundToPick) || null;
  }, [myProgress, currentRoundToPick]);

  const winner = useMemo(() => state.players.find((player) => player.status === "winner") || null, [state.players]);

  const createTournament = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token) {
      toast({
        title: "Login required",
        description: "You must be logged in as admin to create a tournament.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch(`${API_BASE}/api/tournaments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: createTitle,
          playerLimit: Number(createLimit),
          prizePool: Number(createPrizePool),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create tournament");
      }

      toast({ title: "Tournament created", description: "Bracket skeleton generated." });
      await loadState();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create tournament.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const startTournament = async () => {
    if (!token || !state.tournament?._id) return;

    setIsStarting(true);
    try {
      const res = await fetch(`${API_BASE}/api/tournaments/${state.tournament._id}/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to start tournament");
      }

      toast({
        title: "Tournament started",
        description: "The tournament is now live even if not every slot is filled.",
      });
      await loadState();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start tournament.",
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };

  const joinTournament = async () => {
    if (!token || !state.tournament?._id || !selectedPosition) {
      toast({
        title: "Join failed",
        description: "Pick a free position and log in first.",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);
    try {
      const res = await fetch(`${API_BASE}/api/tournaments/${state.tournament._id}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ position: selectedPosition }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to join tournament");
      }

      toast({ title: "Joined tournament", description: `Position #${selectedPosition} locked.` });
      setSelectedPosition(null);
      await loadState();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not join tournament.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const saveSlotSelection = async (slot: SlotSearchResult) => {
    if (!token || !state.tournament?._id || currentRoundToPick === null) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/tournaments/${state.tournament._id}/slot-selection`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roundIndex: currentRoundToPick,
          slotId: slot.url || slot.slotName,
          slotName: slot.slotName,
          provider: slot.provider,
          image: slot.image,
          url: slot.url,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save slot selection");
      }

      toast({ title: "Slot locked", description: `${slot.slotName} saved for this round.` });
      setSlotQuery("");
      setSlotResults([]);
      await loadState();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save slot selection.",
        variant: "destructive",
      });
    }
  };

  const submitMatchResult = async (match: TournamentMatch) => {
    if (!token || !state.tournament?._id) return;

    const inputs = matchInputs[match._id] || emptyMatchInput();
    try {
      const res = await fetch(
        `${API_BASE}/api/tournaments/${state.tournament._id}/matches/${match._id}/result`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            betSizeA: Number(inputs.betSizeA),
            payoutA: Number(inputs.payoutA),
            betSizeB: Number(inputs.betSizeB),
            payoutB: Number(inputs.payoutB),
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to submit result");
      }

      toast({ title: "Match updated", description: `Result saved for ${match.roundLabel}.` });
      await loadState();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit the match result.",
        variant: "destructive",
      });
    }
  };
  const deleteParticipant = async (participantId: string) => {
    if (!token || !state.tournament?._id) return;
    if (!confirm("Are you sure you want to remove this participant from the tournament?")) return;

    setDeletingParticipantId(participantId);
    try {
      const result = await tournamentApi.removeParticipant(state.tournament._id, participantId, token);
      if (result.state) {
        setState(result.state);
      }
      toast({ title: "Participant removed", description: "User has been removed from the tournament." });
      await loadState();
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Failed to remove participant.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDeletingParticipantId(null);
    }
  };
  return (
    <div className='relative flex flex-col min-h-screen overflow-hidden text-white'>
      <GraphicalBackground />
      <Navbar />

      <main className='relative z-10 flex-grow px-4 py-8 sm:px-6 lg:px-8'>
        <section className='mx-auto w-full max-w-[1600px] space-y-8'>
          <div className='overflow-hidden rounded-[2rem] border border-[#C98958]/25 bg-black/60 shadow-2xl shadow-black/40 backdrop-blur-md'>
            <div className='border-b border-[#C98958]/20 bg-gradient-to-r from-[#930203] via-[#A83A12] to-[#C98958]/70 px-6 py-8 sm:px-10'>
              <p className='text-xs font-semibold uppercase tracking-[0.35em] text-white/75'>Tournament Mode</p>
              <div className='mt-4 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px] xl:items-end'>
                <div>
                  <h1 className='text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl'>Bethog Slot Tournament</h1>
                  <p className='max-w-3xl mt-4 text-sm leading-6 text-white/85 sm:text-base'>
                    Players join a fixed bracket, choose one slot for each round, and advance by posting the strongest multiplier.
                    The layout below separates the bracket, player progress, and admin tools so the flow is easier to follow.
                  </p>
                </div>

                <div className='grid gap-3 sm:grid-cols-3 xl:grid-cols-1'>
                  <HeroStat label='Status' value={<StatusBadge status={state.tournament?.status || "upcoming"} />} />
                  <HeroStat label='Players' value={`${state.players.length}/${state.tournament?.playerLimit || 0}`} />
                  <HeroStat label='Prize Pool' value={Number(state.tournament?.prizePool || 0).toLocaleString()} />
                </div>
              </div>
            </div>

            <div className='grid gap-6 px-6 py-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,420px)] xl:px-10 xl:py-10'>
              <section className='space-y-6'>
                <div className='rounded-3xl border border-[#C98958]/20 bg-[#120b0a]/80 p-5 shadow-lg shadow-black/30'>
                  <div className='flex items-center justify-between gap-4'>
                    <div>
                      <h2 className='text-xl font-bold text-white'>Bracket</h2>
                      <p className='text-sm text-white/50'>Real elimination order: winners advance to the next structured matchup.</p>
                    </div>
                    {isLoading && <span className='text-xs uppercase tracking-[0.2em] text-white/40'>Refreshing</span>}
                  </div>

                  <div className='pb-2 mt-6 overflow-x-auto'>
                    <div className='flex flex-col gap-4 sm:flex-row sm:min-w-max'>
                      {groupedMatches.map((round) => (
                        <div key={round.roundIndex} className='w-full sm:min-w-[290px] rounded-2xl border border-[#C98958]/15 bg-black/25 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]'>
                          <div className='mb-4'>
                            <p className='text-xs uppercase tracking-[0.3em] text-white/45'>Round {round.roundIndex + 1}</p>
                            <h3 className='mt-1 text-lg font-bold text-[#E7AC78]'>{round.roundLabel}</h3>
                          </div>

                          <div className='space-y-3'>
                            {round.matches.map((match) => {
                              const selectionA = match.playerA?.slotSelections?.find((selection) => selection.roundIndex === match.roundIndex);
                              const selectionB = match.playerB?.slotSelections?.find((selection) => selection.roundIndex === match.roundIndex);
                              const winnerId = match.winner?._id;

                              return (
                                <div key={match._id} className='rounded-2xl border border-[#C98958]/15 bg-[#100705]/90 p-4'>
                                  <div className='flex items-center justify-between gap-3'>
                                    <p className='text-xs uppercase tracking-[0.25em] text-white/45'>Match {match.matchIndex + 1}</p>
                                    <MatchStatusPill status={match.status} />
                                  </div>

                                  <div className='mt-3 space-y-2'>
                                    <ParticipantRow
                                      label='A'
                                      player={match.playerA}
                                      selection={selectionA}
                                      winner={winnerId === match.playerA?._id}
                                    />
                                    <ParticipantRow
                                      label='B'
                                      player={match.playerB}
                                      selection={selectionB}
                                      winner={winnerId === match.playerB?._id}
                                    />
                                  </div>

                                  {match.status === "completed" && (
                                    <div className='mt-3 rounded-xl border border-[#C98958]/20 bg-black/30 px-3 py-2 text-xs text-[#E7AC78]'>
                                      Multipliers: {formatMultiplier(match.multiplierA)} vs {formatMultiplier(match.multiplierB)}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className='grid gap-6 lg:grid-cols-2'>
                  <div className='rounded-3xl border border-[#C98958]/20 bg-[#120b0a]/80 p-5 shadow-lg shadow-black/30'>
                    <h2 className='text-xl font-bold text-white'>Join the Bracket</h2>
                    <p className='mt-2 text-sm text-white/50'>Pick one open position before the tournament starts.</p>

                    {!token ? (
                      <div className='mt-4 rounded-2xl border border-dashed border-[#C98958]/25 bg-black/25 p-4 text-sm text-white/55'>
                        Sign in to join the tournament. <Link className='text-[#E7AC78] underline' to='/login'>Login</Link>
                      </div>
                    ) : myProgress ? (
                      <div className='mt-4 space-y-3'>
                        <div className='rounded-2xl border border-[#C98958]/20 bg-black/25 p-4'>
                          <p className='text-xs uppercase tracking-[0.2em] text-white/45'>Your Position</p>
                          <p className='mt-1 text-2xl font-bold text-[#E7AC78]'>#{myProgress.position}</p>
                          <p className='mt-1 text-sm text-white/50'>Status: {myProgress.status}</p>
                        </div>

                        <div className='rounded-2xl border border-[#C98958]/20 bg-black/25 p-4'>
                          <p className='text-xs uppercase tracking-[0.2em] text-white/45'>Progress</p>
                          <p className='mt-1 text-sm text-white/70'>Current round unlocked: {myProgress.currentRound + 1}</p>
                          <div className='flex flex-wrap gap-2 mt-3'>
                            {myProgress.slotSelections.map((selection) => (
                              <Badge key={`${selection.roundIndex}-${selection.slotId}`} className='bg-[#930203]/35 text-[#E7AC78] border border-[#C98958]/20'>
                                R{selection.roundIndex + 1}: {selection.slotName}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {myProgress.status === "active" && currentRoundToPick !== null && currentRoundToPick < (state.totalRounds || 0) && (
                          <div className='rounded-2xl border border-[#C98958]/20 bg-black/25 p-4'>
                            <p className='text-xs uppercase tracking-[0.2em] text-white/45'>Select Slot for Round {currentRoundToPick + 1}</p>
                            {currentSelection ? (
                              <div className='mt-3 overflow-hidden rounded-2xl border border-[#C98958]/20 bg-[#100705]'>
                                {currentSelection.image && (
                                  <img src={currentSelection.image} alt={currentSelection.slotName} className='object-cover w-full h-40' />
                                )}
                                <div className='p-4'>
                                  <div className='flex items-center justify-between gap-3'>
                                    <div>
                                      <p className='font-bold text-white'>{currentSelection.slotName}</p>
                                      <p className='text-sm text-white/50'>{currentSelection.provider || "Slot"}</p>
                                    </div>
                                    <Badge className='bg-[#C98958] text-white'>Locked</Badge>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <>
                                <Input
                                  value={slotQuery}
                                  onChange={(event) => setSlotQuery(event.target.value)}
                                  placeholder='Search slot name, provider, or feature'
                                  className='mt-3 border-[#C98958]/25 bg-black/40 text-white placeholder:text-white/35'
                                />

                                <div className='mt-4 space-y-3 max-h-[420px] overflow-y-auto pr-1'>
                                  {slotLoading ? (
                                    <p className='text-sm text-white/45'>Searching Bonushunt slots...</p>
                                  ) : slotResults.length > 0 ? (
                                    slotResults.map((slot) => (
                                      <button
                                        key={slot.url || slot.slotName}
                                        type='button'
                                        onClick={() => saveSlotSelection(slot)}
                                        className='flex w-full gap-3 rounded-2xl border border-[#C98958]/15 bg-black/25 p-3 text-left transition hover:border-[#C98958]'
                                      >
                                        {slot.image && (
                                          <img src={slot.image} alt={slot.slotName} className='object-cover w-16 h-16 rounded-xl' />
                                        )}
                                        <div className='flex-1 min-w-0'>
                                          <p className='font-semibold text-white'>{slot.slotName}</p>
                                          <p className='text-sm text-white/50'>{slot.provider || "Unknown provider"}</p>
                                        </div>
                                      </button>
                                    ))
                                  ) : slotQuery.trim() ? (
                                    <p className='text-sm text-white/45'>No slots found for this search.</p>
                                  ) : (
                                    <p className='text-sm text-white/45'>Type a search term to load slot images and names from Bonushunt.</p>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        <div className='rounded-2xl border border-[#C98958]/20 bg-black/25 p-4'>
                          <p className='text-xs uppercase tracking-[0.2em] text-white/45'>Locked Selections</p>
                          <div className='mt-3 space-y-2'>
                            {myProgress.slotSelections.length > 0 ? (
                              myProgress.slotSelections
                                .slice()
                                .sort((a, b) => a.roundIndex - b.roundIndex)
                                .map((selection) => (
                                  <div key={`${selection.roundIndex}-${selection.slotId}`} className='flex items-center justify-between rounded-xl border border-[#C98958]/15 bg-black/25 px-3 py-2'>
                                    <span className='text-sm text-white/70'>Round {selection.roundIndex + 1}</span>
                                    <span className='text-sm font-semibold text-[#E7AC78]'>{selection.slotName}</span>
                                  </div>
                                ))
                            ) : (
                              <p className='text-sm text-white/45'>No slot selections locked yet.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className='mt-4 space-y-3'>
                        {state.tournament?.status !== "upcoming" ? (
                          <div className='rounded-2xl border border-dashed border-[#C98958]/25 bg-black/25 p-4 text-sm text-white/55'>
                            The bracket is already running or finished.
                          </div>
                        ) : (
                          <>
                            <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
                              {state.availablePositions.map((position) => (
                                <button
                                  key={position}
                                  type='button'
                                  onClick={() => setSelectedPosition(position)}
                                  className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                                    selectedPosition === position
                                      ? "border-[#C98958] bg-[#C98958] text-white"
                                      : "border-[#C98958]/20 bg-black/30 text-[#E7AC78] hover:border-[#C98958]"
                                  }`}
                                >
                                  Spot {position}
                                </button>
                              ))}
                            </div>
                            <Button
                              onClick={joinTournament}
                              disabled={!selectedPosition || isJoining}
                              className='w-full bg-[#C98958] text-white hover:bg-[#930203]'
                            >
                              {isJoining ? "Joining..." : "Join Tournament"}
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className='rounded-3xl border border-[#C98958]/20 bg-[#120b0a]/80 p-5 shadow-lg shadow-black/30'>
                    <h2 className='text-xl font-bold text-white'>Tournament Status</h2>
                    <div className='grid gap-3 mt-4 sm:grid-cols-2'>
                      <InfoTile label='Players' value={`${state.players.length}/${state.tournament?.playerLimit || 0}`} />
                      <InfoTile label='Rounds' value={state.totalRounds || 0} />
                      <InfoTile label='Prize Pool' value={Number(state.tournament?.prizePool || 0).toLocaleString()} />
                      <InfoTile label='Your Seed' value={myProgress?.position ? `#${myProgress.position}` : "—"} />
                    </div>
                    {isAdmin && state.tournament?.status === "upcoming" && (
                      <div className='mt-4 rounded-2xl border border-[#C98958]/15 bg-black/25 p-4'>
                        <p className='text-sm text-white/55'>Start the tournament early even if not all spots are filled.</p>
                        <Button
                          onClick={startTournament}
                          disabled={isStarting}
                          className='mt-3 w-full bg-[#C98958] text-white hover:bg-[#930203]'
                        >
                          {isStarting ? "Starting..." : "Start Tournament"}
                        </Button>
                      </div>
                    )}
                    {winner && (
                      <div className='mt-4 rounded-2xl border border-[#C98958]/20 bg-black/25 p-4'>
                        <p className='text-xs uppercase tracking-[0.2em] text-white/45'>Winner</p>
                        <p className='mt-1 text-2xl font-bold text-[#E7AC78]'>{winner.username}</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <aside className='space-y-6 xl:sticky xl:top-24 xl:self-start'>
                <div className='rounded-3xl border border-[#C98958]/20 bg-[#120b0a]/80 p-5 shadow-lg shadow-black/30'>
                  <h2 className='text-xl font-bold text-white'>Admin Tournament Creator</h2>
                  <p className='mt-2 text-sm text-white/50'>Define player count and prize pool, then the bracket skeleton is created automatically.</p>

                  {isAdmin ? (
                    <form onSubmit={createTournament} className='mt-4 space-y-3'>
                      <Input
                        value={createTitle}
                        onChange={(event) => setCreateTitle(event.target.value)}
                        placeholder='Tournament title'
                        className='border-[#C98958]/25 bg-black/40 text-white placeholder:text-white/35'
                      />
                      <Input
                        value={createLimit}
                        onChange={(event) => setCreateLimit(event.target.value)}
                        type='number'
                        min='4'
                        step='4'
                        placeholder='Player limit'
                        className='border-[#C98958]/25 bg-black/40 text-white placeholder:text-white/35'
                      />
                      <Input
                        value={createPrizePool}
                        onChange={(event) => setCreatePrizePool(event.target.value)}
                        type='number'
                        min='0'
                        placeholder='Prize pool'
                        className='border-[#C98958]/25 bg-black/40 text-white placeholder:text-white/35'
                      />
                      <Button type='submit' disabled={isCreating} className='w-full bg-[#930203] text-white hover:bg-[#C98958]'>
                        {isCreating ? "Creating..." : "Create Tournament"}
                      </Button>
                    </form>
                  ) : (
                    <div className='mt-4 rounded-2xl border border-dashed border-[#C98958]/25 bg-black/25 p-4 text-sm text-white/55'>
                      Admin only. Tournament creation and result submission are shown here for admins.
                    </div>
                  )}
                </div>

                {isAdmin && state.tournament && (
                  <div className='rounded-3xl border border-[#C98958]/20 bg-[#120b0a]/80 p-5 shadow-lg shadow-black/30'>
                    <h2 className='text-xl font-bold text-white'>Match Control</h2>
                    <p className='mt-2 text-sm text-white/50'>Enter each player multiplier and submit the winner automatically.</p>

                    <div className='mt-4 space-y-3 max-h-[760px] overflow-y-auto pr-1'>
                      {state.matches.map((match) => {
                        const inputs = matchInputs[match._id] || emptyMatchInput();
                        return (
                          <div key={match._id} className='rounded-2xl border border-[#C98958]/15 bg-black/25 p-4'>
                            <div className='flex items-center justify-between gap-3'>
                              <div>
                                <p className='text-xs uppercase tracking-[0.25em] text-white/45'>{match.roundLabel}</p>
                                <p className='text-sm text-white/60'>Match {match.matchIndex + 1}</p>
                              </div>
                              <MatchStatusPill status={match.status} />
                            </div>

                            <div className='mt-3 space-y-2 text-sm text-white/75'>
                              <p>A: {match.playerA?.username || "Bye (auto x0)"}</p>
                              <p>B: {match.playerB?.username || "Bye (auto x0)"}</p>
                            </div>

                            {match.status !== "completed" && (match.playerA || match.playerB) && (
                              <div className='mt-3 space-y-2'>
                                {!match.playerA || !match.playerB ? (
                                  <div className='rounded-xl border border-[#C98958]/20 bg-black/20 p-3 text-xs text-white/60'>
                                    <p>One player has a bye. Enter results for the present player and they auto-advance with opponent x0.</p>
                                  </div>
                                ) : null}
                                <div className='grid grid-cols-2 gap-2'>
                                  {match.playerA && (
                                    <>
                                      <div className='rounded-xl border border-[#C98958]/10 bg-black/20 p-2'>
                                        <p className='text-[0.65rem] uppercase tracking-[0.25em] text-white/40'>A Bet Size</p>
                                        <Input
                                          value={inputs.betSizeA}
                                          onChange={(event) =>
                                            setMatchInputs((prev) => ({
                                              ...prev,
                                              [match._id]: { ...(prev[match._id] || emptyMatchInput()), betSizeA: event.target.value },
                                            }))
                                          }
                                          placeholder='Bet size A'
                                          type='number'
                                          step='0.01'
                                          min='0'
                                          className='mt-2 border-[#C98958]/25 bg-black/40 text-white placeholder:text-white/35'
                                        />
                                      </div>
                                      <div className='rounded-xl border border-[#C98958]/10 bg-black/20 p-2'>
                                        <p className='text-[0.65rem] uppercase tracking-[0.25em] text-white/40'>A Payout</p>
                                        <Input
                                          value={inputs.payoutA}
                                          onChange={(event) =>
                                            setMatchInputs((prev) => ({
                                              ...prev,
                                              [match._id]: { ...(prev[match._id] || emptyMatchInput()), payoutA: event.target.value },
                                            }))
                                          }
                                          placeholder='Payout A'
                                          type='number'
                                          step='0.01'
                                          min='0'
                                          className='mt-2 border-[#C98958]/25 bg-black/40 text-white placeholder:text-white/35'
                                        />
                                      </div>
                                    </>
                                  )}
                                  {match.playerB && (
                                    <>
                                      <div className='rounded-xl border border-[#C98958]/10 bg-black/20 p-2'>
                                        <p className='text-[0.65rem] uppercase tracking-[0.25em] text-white/40'>B Bet Size</p>
                                        <Input
                                          value={inputs.betSizeB}
                                          onChange={(event) =>
                                            setMatchInputs((prev) => ({
                                              ...prev,
                                              [match._id]: { ...(prev[match._id] || emptyMatchInput()), betSizeB: event.target.value },
                                            }))
                                          }
                                          placeholder='Bet size B'
                                          type='number'
                                          step='0.01'
                                          min='0'
                                          className='mt-2 border-[#C98958]/25 bg-black/40 text-white placeholder:text-white/35'
                                        />
                                      </div>
                                      <div className='rounded-xl border border-[#C98958]/10 bg-black/20 p-2'>
                                        <p className='text-[0.65rem] uppercase tracking-[0.25em] text-white/40'>B Payout</p>
                                        <Input
                                          value={inputs.payoutB}
                                          onChange={(event) =>
                                            setMatchInputs((prev) => ({
                                              ...prev,
                                              [match._id]: { ...(prev[match._id] || emptyMatchInput()), payoutB: event.target.value },
                                            }))
                                          }
                                          placeholder='Payout B'
                                          type='number'
                                          step='0.01'
                                          min='0'
                                          className='mt-2 border-[#C98958]/25 bg-black/40 text-white placeholder:text-white/35'
                                        />
                                      </div>
                                    </>
                                  )}
                                </div>
                                <Button
                                  type='button'
                                  onClick={() => submitMatchResult(match)}
                                  className='w-full bg-[#C98958] text-white hover:bg-[#930203]'
                                >
                                  Submit Result
                                </Button>
                              </div>
                            )}

                            {match.status === "completed" && (
                              <div className='mt-3 rounded-xl border border-[#C98958]/20 bg-black/30 px-3 py-2 text-xs text-[#E7AC78]'>
                                A: {formatMultiplier(match.multiplierA)}x | B: {formatMultiplier(match.multiplierB)}x
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isAdmin && state.tournament && (
                  <div className='rounded-3xl border border-[#C98958]/20 bg-[#120b0a]/80 p-5 shadow-lg shadow-black/30'>
                    <h2 className='text-xl font-bold text-white'>Manage Participants</h2>
                    <p className='mt-2 text-sm text-white/50'>Remove players from the tournament.</p>

                    <div className='mt-4 space-y-2 max-h-[400px] overflow-y-auto pr-1'>
                      {state.players.length === 0 ? (
                        <p className='text-sm text-white/45'>No participants yet.</p>
                      ) : (
                        state.players.map((player) => (
                          <div
                            key={player._id}
                            className='flex items-center justify-between rounded-2xl border border-[#C98958]/15 bg-black/25 px-3 py-2'
                          >
                            <div className='flex-1 min-w-0'>
                              <p className='text-sm font-semibold text-white truncate'>
                                {player.username} <span className='text-white/50'>#{player.position}</span>
                              </p>
                              <p className='text-xs text-white/40'>
                                Status: {player.status} | Round: {player.currentRound}
                              </p>
                            </div>
                            <Button
                              onClick={() => deleteParticipant(player._id)}
                              disabled={deletingParticipantId === player._id}
                              variant='destructive'
                              className='ml-2 text-xs'
                            >
                              {deletingParticipantId === player._id ? 'Removing...' : 'Remove'}
                            </Button>
                          </div>
                        ))
                      )}
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

function HeroStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='px-4 py-3 border shadow-inner rounded-2xl border-white/10 bg-black/20 shadow-black/20 backdrop-blur-sm'>
      <p className='text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-white/45'>{label}</p>
      <div className='mt-2 text-lg font-bold text-white'>{value}</div>
    </div>
  );
}

function ParticipantRow({
  label,
  player,
  selection,
  winner,
}: {
  label: string;
  player: TournamentPlayer | null;
  selection?: SlotSelection | null;
  winner?: boolean;
}) {
  return (
    <div className={`rounded-xl border px-3 py-2 ${winner ? "border-[#C98958] bg-[#930203]/25" : "border-[#C98958]/10 bg-black/25"}`}>
      <div className='flex items-center justify-between gap-3'>
        <div className='flex items-center min-w-0 gap-3'>
          {selection?.image && (
            <img
              src={selection.image}
              alt={selection.slotName || `${player?.username || 'slot'} image`}
              className='flex-shrink-0 object-cover w-10 h-10 rounded-md'
            />
          )}
          <div className='min-w-0'>
            <p className='text-[0.65rem] uppercase tracking-[0.25em] text-white/40'>{label}</p>
            <p className='text-sm font-semibold text-white truncate'>{player?.username || "TBD"}</p>
          </div>
        </div>
        {winner && <Badge className='bg-[#C98958] text-white'>Winner</Badge>}
      </div>
      <div className='flex flex-wrap items-center gap-2 mt-2 text-xs text-white/50'>
        <span>Seed #{player?.position || "—"}</span>
        <span>•</span>
        <span className='truncate max-w-[180px]'>{selection?.slotName || "No slot selected yet"}</span>
      </div>
    </div>
  );
}

function MatchStatusPill({ status }: { status: TournamentMatch["status"] }) {
  const className =
    status === "completed"
      ? "bg-[#C98958] text-white"
      : status === "ready"
      ? "bg-green-600 text-white"
      : "bg-[#2c2f48] text-white/60";

  const label = status === "completed" ? "Completed" : status === "ready" ? "Ready" : "Waiting";

  return <Badge className={className}>{label}</Badge>;
}

function StatusBadge({ status }: { status: TournamentStatus }) {
  const className =
    status === "finished"
      ? "bg-[#C98958] text-white"
      : status === "ongoing"
      ? "bg-green-600 text-white"
      : "bg-[#2c2f48] text-white/60";

  const label = status === "finished" ? "Finished" : status === "ongoing" ? "Ongoing" : "Upcoming";

  return <Badge className={className}>{label}</Badge>;
}

function InfoTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className='rounded-2xl border border-[#C98958]/20 bg-black/25 p-4'>
      <p className='text-xs uppercase tracking-[0.25em] text-white/45'>{label}</p>
      <p className='mt-1 text-xl font-bold text-[#E7AC78]'>{value}</p>
    </div>
  );
}

export default TournamentPage;
