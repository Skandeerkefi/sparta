import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "@/lib/api";
import GraphicalBackground from "@/components/GraphicalBackground";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/hooks/use-toast";

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

interface SlotSearchResult {
  slotName: string;
  provider?: string;
  image?: string;
  url?: string;
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

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

function BonusHuntAdminPage() {
  const { user, token } = useAuthStore();
  const { toast } = useToast();

  const isAdmin = user?.role === "admin";
  const [view, setView] = useState<BonusHuntView>(emptyView);
  const [historyCount, setHistoryCount] = useState(0);
  const [historyItems, setHistoryItems] = useState<BonusHuntHistoryItem[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const [title, setTitle] = useState("Bethog Bonus Hunt");
  const [startCost, setStartCost] = useState("0");
  const [targetProfit, setTargetProfit] = useState("");

  const [selectedSlot, setSelectedSlot] = useState<SlotSearchResult | null>(null);
  const [slotQuery, setSlotQuery] = useState("");
  const [slotResults, setSlotResults] = useState<SlotSearchResult[]>([]);
  const [slotLoading, setSlotLoading] = useState(false);

  const [betSize, setBetSize] = useState("");
  const [bonusType, setBonusType] = useState<"normal" | "super">("normal");
  const [note, setNote] = useState("");

  const [resultInputs, setResultInputs] = useState<Record<string, string>>({});

  const loadView = useCallback(async () => {
    try {
      const [currentRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/api/bonus-hunts/current`),
        fetch(`${API_BASE}/api/bonus-hunts/history`),
      ]);

      const currentData = (await currentRes.json()) as BonusHuntView;
      const historyData = (await historyRes.json()) as { history?: BonusHuntHistoryItem[] };

      setView({ ...emptyView, ...currentData });
      setHistoryCount(historyData.history?.length || 0);
      setHistoryItems(historyData.history || []);

      const nextInputs: Record<string, string> = {};
      (currentData.games || []).forEach((game) => {
        nextInputs[game._id] = game.payout !== null ? String(game.payout) : "";
      });
      setResultInputs(nextInputs);
    } catch (error) {
      console.error("Load bonus hunt admin view failed:", error);
      toast({
        title: "Error",
        description: "Failed to load bonus hunt data.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    loadView();
    const interval = setInterval(loadView, 5000);
    return () => clearInterval(interval);
  }, [loadView]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!slotQuery.trim()) {
        setSlotResults([]);
        return;
      }

      setSlotLoading(true);
      try {
        const response = await fetch(
          `${API_BASE}/api/bonus-hunts/slots/search?q=${encodeURIComponent(slotQuery)}&site=Stake`
        );
        const data = await response.json();
        setSlotResults(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setSlotResults([]);
      } finally {
        setSlotLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [slotQuery]);

  const hunt = view.hunt;
  const stats = view.stats;

  const canManageDraft = hunt?.status === "draft";
  const canManageOngoing = hunt?.status === "ongoing";

  const createHunt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    setIsCreating(true);
    try {
      const response = await fetch(`${API_BASE}/api/bonus-hunts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          startCost: Number(startCost),
          targetProfit: targetProfit ? Number(targetProfit) : 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create hunt");
      }

      toast({ title: "Bonus hunt created", description: "You can now add slots to the hunt." });
      setSelectedSlot(null);
      setSlotQuery("");
      setSlotResults([]);
      setBetSize("");
      setNote("");
      await loadView();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to create the hunt."),
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const addGame = async () => {
    if (!token || !hunt?._id || !selectedSlot) return;

    try {
      const response = await fetch(`${API_BASE}/api/bonus-hunts/${hunt._id}/games`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slotId: selectedSlot.url || selectedSlot.slotName,
          slotName: selectedSlot.slotName,
          provider: selectedSlot.provider,
          image: selectedSlot.image,
          url: selectedSlot.url,
          betSize: Number(betSize),
          bonusType,
          note,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add game");
      }

      toast({ title: "Game added", description: `${selectedSlot.slotName} locked in the hunt.` });
      setSelectedSlot(null);
      setSlotQuery("");
      setSlotResults([]);
      setBetSize("");
      setBonusType("normal");
      setNote("");
      await loadView();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to add game."),
        variant: "destructive",
      });
    }
  };

  const startHunt = async () => {
    if (!token || !hunt?._id) return;

    try {
      const response = await fetch(`${API_BASE}/api/bonus-hunts/${hunt._id}/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to start hunt");
      }

      toast({ title: "Hunt started", description: "Games are now locked and payouts can be entered." });
      await loadView();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to start hunt."),
        variant: "destructive",
      });
    }
  };

  const finishHunt = async () => {
    if (!token || !hunt?._id) return;

    try {
      const response = await fetch(`${API_BASE}/api/bonus-hunts/${hunt._id}/finish`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to finish hunt");
      }

      toast({ title: "Hunt finished", description: "The bonus hunt is now archived." });
      await loadView();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to finish hunt."),
        variant: "destructive",
      });
    }
  };

  const saveResult = async (gameId: string) => {
    if (!token || !hunt?._id) return;

    try {
      const response = await fetch(`${API_BASE}/api/bonus-hunts/${hunt._id}/games/${gameId}/result`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ payout: Number(resultInputs[gameId]) }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save result");
      }

      toast({ title: "Result saved", description: "Game payout and multiplier updated." });
      await loadView();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to save result."),
        variant: "destructive",
      });
    }
  };

  const deleteGame = async (gameId: string) => {
    if (!token || !hunt?._id) return;

    try {
      const response = await fetch(`${API_BASE}/api/bonus-hunts/${hunt._id}/games/${gameId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete game");
      }

      toast({ title: "Game removed", description: "Draft slot removed from the hunt." });
      await loadView();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to delete game."),
        variant: "destructive",
      });
    }
  };

  const deleteHunt = async (huntId: string) => {
    if (!token || !confirm("Delete this bonus hunt and all its games?")) return;

    try {
      const response = await fetch(`${API_BASE}/api/bonus-hunts/${huntId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete bonus hunt");
      }

      toast({ title: "Bonus hunt deleted", description: "The previous hunt was removed." });
      await loadView();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to delete bonus hunt."),
        variant: "destructive",
      });
    }
  };

  const currentSectionTitle = useMemo(() => {
    if (!hunt) return "No bonus hunt exists yet";
    if (hunt.status === "draft") return "Draft Hunt Builder";
    if (hunt.status === "ongoing") return "Live Hunt Manager";
    return "Finished Hunt Archive";
  }, [hunt]);

  return (
    <div className='relative flex min-h-screen flex-col overflow-x-hidden overflow-hidden text-white'>
      <GraphicalBackground />
      <Navbar />

      <main className='relative z-10 flex-grow px-4 py-8 sm:px-6 lg:px-8'>
        <section className='w-full mx-auto space-y-6 max-w-7xl'>
          <div className='overflow-hidden rounded-[2rem] border border-[#C98958]/25 bg-black/60 shadow-2xl shadow-black/40 backdrop-blur-md'>
            <div className='border-b border-[#C98958]/20 bg-gradient-to-r from-[#930203] to-[#C98958]/70 px-6 py-8 sm:px-10'>
              <p className='text-xs font-semibold uppercase tracking-[0.35em] text-white/75'>Admin Control</p>
              <div className='flex flex-col gap-4 mt-3 lg:flex-row lg:items-end lg:justify-between'>
                <div>
                  <h1 className='text-3xl font-black tracking-tight text-white sm:text-5xl'>Bonus Hunt Manager</h1>
                  <p className='max-w-3xl mt-3 text-sm text-white/85 sm:text-base'>
                    Create a bonus hunt, add slot games with images and notes, start the run, and enter payouts while the system
                    calculates the multiplier and hunt-wide stats.
                  </p>
                </div>

                <div className='flex flex-wrap gap-2'>
                  <Badge className='bg-[#120b0a] text-[#E7AC78] border border-[#C98958]/30'>{currentSectionTitle}</Badge>
                  <Badge className='bg-[#120b0a] text-[#E7AC78] border border-[#C98958]/30'>History {historyCount}</Badge>
                  {hunt && <Badge className='bg-[#120b0a] text-[#E7AC78] border border-[#C98958]/30'>{hunt.status}</Badge>}
                </div>
              </div>
            </div>

            <div className='grid gap-6 px-6 py-6 lg:grid-cols-[0.95fr_1.35fr] lg:px-10 lg:py-10'>
              <aside className='space-y-6'>
                <Card className='border-[#C98958]/20 bg-[#120b0a]/80 text-white shadow-lg shadow-black/30'>
                  <CardContent className='p-5 sm:p-6'>
                    <h2 className='text-xl font-bold text-white'>Create Hunt</h2>
                    <p className='mt-1 text-sm text-white/50'>Define the hunt name and start cost before adding games.</p>

                    {!isAdmin ? (
                      <div className='mt-4 rounded-2xl border border-dashed border-[#C98958]/25 bg-black/25 p-4 text-sm text-white/55'>
                        Admin access required.
                      </div>
                    ) : (
                      <form onSubmit={createHunt} className='mt-4 space-y-3'>
                        <div>
                          <Label className='text-[#C98958]'>Hunt Name</Label>
                          <Input
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            className='border-[#C98958]/25 bg-black/40 text-white placeholder:text-white/35'
                            placeholder='Bethog Bonus Hunt'
                          />
                        </div>
                        <div>
                          <Label className='text-[#C98958]'>Start Cost ($)</Label>
                          <Input
                            value={startCost}
                            onChange={(event) => setStartCost(event.target.value)}
                            type='number'
                            min='0'
                            className='border-[#C98958]/25 bg-black/40 text-white placeholder:text-white/35'
                          />
                        </div>
                        <div>
                          <Label className='text-[#C98958]'>Target Profit ($, optional)</Label>
                          <Input
                            value={targetProfit}
                            onChange={(event) => setTargetProfit(event.target.value)}
                            type='number'
                            min='0'
                            className='border-[#C98958]/25 bg-black/40 text-white placeholder:text-white/35'
                          />
                        </div>
                        <Button type='submit' disabled={isCreating} className='w-full bg-[#C98958] text-white hover:bg-[#930203]'>
                          {isCreating ? "Creating..." : "Create Hunt"}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>

                <Card className='border-[#C98958]/20 bg-[#120b0a]/80 text-white shadow-lg shadow-black/30'>
                  <CardContent className='p-5 sm:p-6'>
                    <div className='flex items-center justify-between gap-3'>
                      <div>
                        <h2 className='text-xl font-bold text-white'>Slot Picker</h2>
                        <p className='mt-1 text-sm text-white/50'>Search Stake slots with images before adding a game.</p>
                      </div>
                      <Badge className={hunt?.status === "draft" ? "bg-[#930203] text-white" : "bg-[#2c2f48] text-white"}>
                        {hunt?.status === "draft" ? "Draft only" : "Locked"}
                      </Badge>
                    </div>

                    <div className='mt-4 space-y-3'>
                      <Input
                        value={slotQuery}
                        onChange={(event) => setSlotQuery(event.target.value)}
                        placeholder='Search slot name or provider'
                        className='border-[#C98958]/25 bg-black/40 text-white placeholder:text-white/35'
                        disabled={!canManageDraft}
                      />

                      {selectedSlot && (
                        <div className='rounded-2xl border border-[#C98958]/20 bg-black/25 p-3'>
                          <p className='text-xs uppercase tracking-[0.25em] text-white/45'>Selected Slot</p>
                          <p className='mt-1 font-semibold text-white'>{selectedSlot.slotName}</p>
                          <p className='text-sm text-white/45'>{selectedSlot.provider || "Unknown provider"}</p>
                        </div>
                      )}

                      <div className='max-h-[300px] space-y-3 overflow-y-auto pr-1'>
                        {slotLoading ? (
                          <p className='text-sm text-white/45'>Searching slots...</p>
                        ) : slotResults.length > 0 ? (
                          slotResults.map((slot) => (
                            <button
                              key={slot.url || slot.slotName}
                              type='button'
                              disabled={!canManageDraft}
                              onClick={() => setSelectedSlot(slot)}
                              className={`flex w-full gap-3 rounded-2xl border p-3 text-left transition ${
                                selectedSlot?.slotName === slot.slotName
                                  ? "border-[#C98958] bg-[#930203]/25"
                                  : "border-[#C98958]/15 bg-black/25 hover:border-[#C98958]"
                              }`}
                            >
                              {slot.image ? (
                                <img src={slot.image} alt={slot.slotName} className='object-cover w-16 h-16 rounded-xl' />
                              ) : (
                                <div className='flex h-16 w-16 items-center justify-center rounded-xl bg-black/30 text-[10px] text-white/35'>
                                  No image
                                </div>
                              )}
                              <div className='flex-1 min-w-0'>
                                <p className='font-semibold text-white truncate'>{slot.slotName}</p>
                                <p className='text-sm text-white/45'>{slot.provider || "Unknown provider"}</p>
                              </div>
                            </button>
                          ))
                        ) : slotQuery.trim() ? (
                          <p className='text-sm text-white/45'>No slots found.</p>
                        ) : (
                          <p className='text-sm text-white/45'>Search for a slot to add it to the hunt.</p>
                        )}
                      </div>

                      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                        <div>
                          <Label className='text-[#C98958]'>Bet Size ($)</Label>
                          <Input
                            value={betSize}
                            onChange={(event) => setBetSize(event.target.value)}
                            type='number'
                            min='0'
                            disabled={!canManageDraft}
                            className='border-[#C98958]/25 bg-black/40 text-white placeholder:text-white/35'
                          />
                        </div>
                        <div>
                          <Label className='text-[#C98958]'>Bonus Type</Label>
                          <select
                            value={bonusType}
                            onChange={(event) => setBonusType(event.target.value as "normal" | "super")}
                            disabled={!canManageDraft}
                            className='h-10 w-full rounded-md border border-[#C98958]/25 bg-black/40 px-3 text-white outline-none'
                          >
                            <option value='normal'>Normal</option>
                            <option value='super'>Super</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <Label className='text-[#C98958]'>Note</Label>
                        <Input
                          value={note}
                          onChange={(event) => setNote(event.target.value)}
                          placeholder='Optional note'
                          disabled={!canManageDraft}
                          className='border-[#C98958]/25 bg-black/40 text-white placeholder:text-white/35'
                        />
                      </div>

                      <Button
                        type='button'
                        onClick={addGame}
                        disabled={!canManageDraft || !hunt || !selectedSlot}
                        className='w-full bg-[#930203] text-white hover:bg-[#C98958]'
                      >
                        Add Game
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </aside>

              <section className='space-y-6'>
                <Card className='border-[#C98958]/20 bg-[#120b0a]/80 text-white shadow-lg shadow-black/30'>
                  <CardContent className='p-5 sm:p-6'>
                    <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
                      <div>
                        <h2 className='text-xl font-bold text-white'>Current Hunt Manager</h2>
                        <p className='mt-1 text-sm text-white/50'>Add slot games, enter payouts, and finish the hunt from one panel.</p>
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        {hunt && <Badge className='bg-[#120b0a] text-[#E7AC78] border border-[#C98958]/30'>{hunt.status}</Badge>}
                        {stats && <Badge className='bg-[#120b0a] text-[#E7AC78] border border-[#C98958]/30'>Progress {stats.progressPercent}%</Badge>}
                      </div>
                    </div>

                    {hunt ? (
                      <div className='mt-5 space-y-4'>
                        <div className='rounded-2xl border border-[#C98958]/20 bg-black/25 p-4'>
                          <div className='flex flex-wrap items-center justify-between gap-3'>
                            <div>
                              <p className='text-xs uppercase tracking-[0.25em] text-white/45'>Current Hunt</p>
                              <h3 className='mt-1 text-2xl font-black text-[#E7AC78]'>{hunt.title}</h3>
                            </div>
                            <div className='flex gap-2'>
                              {canManageDraft && (
                                <Button onClick={startHunt} className='bg-[#C98958] text-white hover:bg-[#930203]'>
                                  Start Hunt
                                </Button>
                              )}
                              {canManageOngoing && (
                                <Button onClick={finishHunt} className='bg-[#930203] text-white hover:bg-[#C98958]'>
                                  Finish Hunt
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
                          {view.games.length > 0 ? (
                            view.games.map((game) => (
                              <Card key={game._id} className='border-[#C98958]/15 bg-black/25 text-white'>
                                <CardContent className='p-0'>
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
                                        <p className='text-xs text-white/45'>{game.provider || "Unknown provider"}</p>
                                      </div>
                                      <Badge className={game.bonusType === "super" ? "bg-[#C98958] text-white" : "bg-[#2c2f48] text-white"}>
                                        {game.bonusType}
                                      </Badge>
                                    </div>

                                    <p className='text-sm text-white/60'>Bet: {formatNumber(game.betSize)}$</p>
                                    {game.note && <p className='text-sm text-white/50'>{game.note}</p>}

                                    {canManageDraft && (
                                      <div className='flex gap-2'>
                                        <Button
                                          type='button'
                                          onClick={() => deleteGame(game._id)}
                                          className='flex-1 bg-[#930203] text-white hover:bg-[#C98958]'
                                        >
                                          Delete
                                        </Button>
                                      </div>
                                    )}

                                    {canManageOngoing && game.status !== "completed" && (
                                      <div className='space-y-2 rounded-2xl border border-[#C98958]/15 bg-black/25 p-3'>
                                        <Label className='text-[#C98958]'>Payout ($)</Label>
                                        <Input
                                          value={resultInputs[game._id] || ""}
                                          onChange={(event) =>
                                            setResultInputs((prev) => ({ ...prev, [game._id]: event.target.value }))
                                          }
                                          type='number'
                                          min='0'
                                          className='border-[#C98958]/25 bg-black/40 text-white placeholder:text-white/35'
                                        />
                                        <Button
                                          type='button'
                                          onClick={() => saveResult(game._id)}
                                          className='w-full bg-[#C98958] text-white hover:bg-[#930203]'
                                        >
                                          Save Result
                                        </Button>
                                      </div>
                                    )}

                                    <div className='rounded-xl border border-[#C98958]/15 bg-black/30 px-3 py-2 text-sm'>
                                      <div className='flex items-center justify-between'>
                                        <span className='text-white/50'>Payout</span>
                                        <span className='font-semibold text-[#E7AC78]'>
                                          {game.status === "completed" ? `${formatNumber(game.payout)}$` : "Pending"}
                                        </span>
                                      </div>
                                      <div className='flex items-center justify-between mt-1'>
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
                        Create a hunt to begin managing it.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className='border-[#C98958]/20 bg-[#120b0a]/80 text-white shadow-lg shadow-black/30'>
                  <CardContent className='p-5 sm:p-6'>
                    <h2 className='text-xl font-bold text-white'>Current Hunt Stats</h2>
                    <p className='mt-1 text-sm text-white/50'>Live calculations update as results are entered.</p>

                    {stats ? (
                      <div className='grid gap-3 mt-4 sm:grid-cols-2'>
                        <MiniStat label='Total Winnings' value={`${formatNumber(stats.totalWinnings)}$`} />
                        <MiniStat label='P&L' value={`${stats.profitLoss >= 0 ? "+" : ""}${formatNumber(stats.profitLoss)}$`} />
                        <MiniStat label='Run Avg X' value={formatMultiplier(stats.runAvgX)} />
                        <MiniStat label='Req Avg X' value={formatMultiplier(stats.reqAvgTargetX ?? stats.reqAvgBreakEvenX)} />
                        <MiniStat label='Completed' value={`${stats.completedGames}/${stats.totalGames}`} />
                        <MiniStat label='Remaining' value={stats.remainingGames} />
                      </div>
                    ) : (
                      <p className='mt-4 text-sm text-white/45'>No hunt stats available yet.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className='border-[#C98958]/20 bg-[#120b0a]/80 text-white shadow-lg shadow-black/30'>
                  <CardContent className='p-5 sm:p-6'>
                    <h2 className='text-xl font-bold text-white'>History</h2>
                    <p className='mt-1 text-sm text-white/50'>Past hunts remain visible to everyone on the public page.</p>
                    <Link to='/bonus-hunt' className='mt-4 inline-flex text-sm font-semibold text-[#E7AC78] underline'>
                      View public history page
                    </Link>

                    <div className='mt-5 space-y-3'>
                      {historyItems.length > 0 ? (
                        historyItems.map((item) => (
                          <div key={item.hunt._id} className='rounded-2xl border border-[#C98958]/15 bg-black/25 p-4'>
                            <div className='flex items-start justify-between gap-3'>
                              <div>
                                <p className='font-semibold text-white'>{item.hunt.title}</p>
                                <p className='text-xs text-white/45'>
                                  {item.hunt.status} • {item.stats.completedGames}/{item.stats.totalGames} games
                                </p>
                              </div>
                              <Button
                                type='button'
                                onClick={() => deleteHunt(item.hunt._id)}
                                className='bg-[#930203] text-white hover:bg-[#C98958]'
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className='mt-4 text-sm text-white/45'>No previous hunts to delete.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </section>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className='rounded-2xl border border-[#C98958]/15 bg-black/25 p-4'>
      <p className='text-xs uppercase tracking-[0.25em] text-white/45'>{label}</p>
      <p className='mt-2 text-lg font-bold text-[#E7AC78]'>{value}</p>
    </div>
  );
}

export default BonusHuntAdminPage;
