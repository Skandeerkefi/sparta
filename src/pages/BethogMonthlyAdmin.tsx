import React, { useEffect, useMemo, useState } from "react";
import { API_BASE } from "@/lib/api";
import GraphicalBackground from "@/components/GraphicalBackground";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface ShuffleEntry {
  _id: string;
  username: string;
  wagering: number;
  prize: number;
}

interface ShuffleLeaderboard {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
  active: boolean;
  entries: ShuffleEntry[];
  totalPrize?: number;
  prizeSplit?: number[];
  totalWagering?: number;
}

type EntryFormState = {
  username: string;
  wagering: string;
};

type LeaderboardFormState = {
  title: string;
  startDate: string;
  endDate: string;
  totalPrize: string;
  prizeSplit: string;
  active: boolean;
};

const emptyLeaderboardForm: LeaderboardFormState = {
  title: "",
  startDate: "",
  endDate: "",
  totalPrize: "0",
  prizeSplit: "",
  active: true,
};

const emptyEntryForm: EntryFormState = {
  username: "",
  wagering: "0",
};

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function toIsoDateTimeLocal(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function ShuffleMonthlyAdmin() {
  const [leaderboards, setLeaderboards] = useState<ShuffleLeaderboard[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [createLeaderboardForm, setCreateLeaderboardForm] = useState<LeaderboardFormState>(emptyLeaderboardForm);
  const [editLeaderboardForm, setEditLeaderboardForm] = useState<LeaderboardFormState>(emptyLeaderboardForm);
  const [entryForm, setEntryForm] = useState<EntryFormState>(emptyEntryForm);
  const [editingEntryId, setEditingEntryId] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedLeaderboard = useMemo(
    () => leaderboards.find((leaderboard) => leaderboard._id === selectedId) || leaderboards[0] || null,
    [leaderboards, selectedId]
  );

  const totalPrize = selectedLeaderboard?.totalPrize ?? selectedLeaderboard?.entries.reduce((sum, entry) => sum + Number(entry.prize || 0), 0) ?? 0;
  const totalWagering = selectedLeaderboard?.totalWagering || selectedLeaderboard?.entries.reduce((sum, entry) => sum + Number(entry.wagering || 0), 0) || 0;
  const prizeSplitText = selectedLeaderboard?.prizeSplit?.join(", ") || "";

  const loadLeaderboards = async (keepSelection = true) => {
    setPageLoading(true);
    setPageError("");
    try {
      const res = await fetch(`${API_BASE}/api/shuffle-leaderboards`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load leaderboards");
      const rows = Array.isArray(data) ? data : [];
      setLeaderboards(rows);
      setSelectedId((current) => {
        if (keepSelection && current && rows.some((row) => row._id === current)) return current;
        return rows[0]?._id || "";
      });
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to load leaderboards");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboards();
  }, []);

  useEffect(() => {
    if (!selectedLeaderboard) {
      setCreateLeaderboardForm(emptyLeaderboardForm);
      setEditLeaderboardForm(emptyLeaderboardForm);
      setEntryForm(emptyEntryForm);
      setEditingEntryId("");
      return;
    }

    setEditLeaderboardForm({
      title: selectedLeaderboard.title,
      startDate: toIsoDateTimeLocal(selectedLeaderboard.startDate),
      endDate: toIsoDateTimeLocal(selectedLeaderboard.endDate),
      totalPrize: String(selectedLeaderboard.totalPrize ?? 0),
      prizeSplit: prizeSplitText,
      active: selectedLeaderboard.active,
    });
    setEntryForm(emptyEntryForm);
    setEditingEntryId("");
  }, [prizeSplitText, selectedLeaderboard]);

  const createLeaderboard = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/shuffle-leaderboards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createLeaderboardForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to create leaderboard");
      setCreateLeaderboardForm(emptyLeaderboardForm);
      await loadLeaderboards(false);
      setSelectedId(data?._id || "");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to create leaderboard");
    } finally {
      setSaving(false);
    }
  };

  const updateLeaderboard = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedLeaderboard) return;
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/shuffle-leaderboards/${selectedLeaderboard._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editLeaderboardForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to update leaderboard");
      await loadLeaderboards();
      setSelectedId(data?._id || selectedLeaderboard._id);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to update leaderboard");
    } finally {
      setSaving(false);
    }
  };

  const deleteLeaderboard = async () => {
    if (!selectedLeaderboard) return;
    if (!window.confirm(`Delete leaderboard "${selectedLeaderboard.title}"?`)) return;
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/shuffle-leaderboards/${selectedLeaderboard._id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to delete leaderboard");
      await loadLeaderboards(false);
      setSelectedId("");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to delete leaderboard");
    } finally {
      setSaving(false);
    }
  };

  const submitEntry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedLeaderboard) return;
    setSaving(true);
    try {
      const entryUrl = editingEntryId
        ? `${API_BASE}/api/shuffle-leaderboards/${selectedLeaderboard._id}/entries/${editingEntryId}`
        : `${API_BASE}/api/shuffle-leaderboards/${selectedLeaderboard._id}/entries`;
      const response = await fetch(entryUrl, {
        method: editingEntryId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entryForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to save entry");
      setEntryForm(emptyEntryForm);
      setEditingEntryId("");
      await loadLeaderboards();
      setSelectedId(data?._id || selectedLeaderboard._id);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to save entry");
    } finally {
      setSaving(false);
    }
  };

  const saveInlineEntry = async () => {
    if (!selectedLeaderboard || !editingEntryId) return;
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/shuffle-leaderboards/${selectedLeaderboard._id}/entries/${editingEntryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entryForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to update entry");
      setEntryForm(emptyEntryForm);
      setEditingEntryId("");
      await loadLeaderboards();
      setSelectedId(data?._id || selectedLeaderboard._id);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to update entry");
    } finally {
      setSaving(false);
    }
  };

  const startEditEntry = (entry: ShuffleEntry) => {
    setPageError("");
    setEditingEntryId(entry._id);
    setEntryForm({
      username: entry.username,
      wagering: String(entry.wagering ?? 0),
    });
  };

  const cancelEditEntry = () => {
    setEditingEntryId("");
    setEntryForm(emptyEntryForm);
  };

  const deleteEntry = async (entryId: string, username: string) => {
    if (!selectedLeaderboard) return;
    if (!window.confirm(`Delete ${username} from this leaderboard?`)) return;
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/shuffle-leaderboards/${selectedLeaderboard._id}/entries/${entryId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to delete entry");
      await loadLeaderboards();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to delete entry");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden overflow-hidden text-white">
      <GraphicalBackground />
      <Navbar />

      <main className="relative z-10 flex-grow px-4 py-8 sm:px-6 lg:px-8">
        <section className="mx-auto w-full max-w-7xl">
          <div className="overflow-hidden rounded-[2rem] border border-[#C98958]/25 bg-black/55 shadow-2xl shadow-black/40 backdrop-blur-md">
            <div className="border-b border-[#C98958]/20 bg-gradient-to-r from-[#930203] to-[#C98958]/70 px-6 py-8 sm:px-10">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/75">Admin Control</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-5xl">Shuffle Leaderboard Admin</h1>
              <p className="mt-3 max-w-3xl text-sm text-white/80 sm:text-base">
                Create leaderboard events, set date ranges, edit player rows, and manage prizes in one panel.
              </p>
            </div>

            <div className="grid gap-4 border-b border-[#C98958]/15 px-6 py-6 sm:grid-cols-2 xl:grid-cols-4 sm:px-10">
              <div className="rounded-2xl border border-[#C98958]/20 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-white/45">Leaderboards</p>
                <p className="mt-2 text-2xl font-bold text-[#E7AC78]">{leaderboards.length}</p>
              </div>
              <div className="rounded-2xl border border-[#C98958]/20 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-white/45">Selected Entries</p>
                <p className="mt-2 text-2xl font-bold text-white">{selectedLeaderboard?.entries.length || 0}</p>
              </div>
              <div className="rounded-2xl border border-[#C98958]/20 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-white/45">Total Prize</p>
                <p className="mt-2 text-2xl font-bold text-[#C98958]">{Number(totalPrize).toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-[#C98958]/20 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-white/45">Total Wagering</p>
                <p className="mt-2 text-2xl font-bold text-[#E7AC78]">{Number(totalWagering).toLocaleString()}</p>
              </div>
            </div>

            <div className="grid gap-6 px-6 py-6 lg:grid-cols-[360px_1fr] lg:px-10 lg:py-10">
              <aside className="space-y-6">
                <div className="rounded-3xl border border-[#C98958]/20 bg-[#120b0a]/80 p-5 shadow-lg shadow-black/30">
                  <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.25em] text-white/60">Leaderboard</label>
                  <select
                    value={selectedId}
                    onChange={(event) => setSelectedId(event.target.value)}
                    className="w-full rounded-xl border border-[#C98958]/30 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-[#C98958]"
                  >
                    {leaderboards.length > 0 ? (
                      leaderboards.map((leaderboard) => (
                        <option key={leaderboard._id} value={leaderboard._id}>
                          {leaderboard.title} {leaderboard.active ? "(Active)" : ""}
                        </option>
                      ))
                    ) : (
                      <option value="">No leaderboards available</option>
                    )}
                  </select>
                </div>

                <form onSubmit={createLeaderboard} className="rounded-3xl border border-[#C98958]/20 bg-[#120b0a]/80 p-5 shadow-lg shadow-black/30 space-y-4">
                  <h3 className="text-lg font-bold text-white">Create Leaderboard</h3>
                  <div>
                    <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.25em] text-white/60">Title</label>
                  <div className="rounded-3xl border border-[#C98958]/20 bg-[#120b0a]/80 p-5 shadow-lg shadow-black/30 space-y-3">
                    <h3 className="text-lg font-bold text-white">Prize Split</h3>
                    <p className="text-sm text-white/65">
                      Total Prize: <span className="font-semibold text-[#E7AC78]">{Number(selectedLeaderboard?.totalPrize ?? 0).toLocaleString()}</span>
                    </p>
                    {selectedLeaderboard?.prizeSplit?.length ? (
                      <div className="space-y-2">
                        {selectedLeaderboard.prizeSplit.map((amount, index) => (
                          <div key={`${amount}-${index}`} className="flex items-center justify-between rounded-xl border border-[#C98958]/15 bg-black/35 px-4 py-3">
                            <span className="text-sm text-white/70">Top {index + 1}</span>
                            <span className="font-semibold text-[#E7AC78]">{Number(amount).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-xl border border-dashed border-[#C98958]/20 bg-black/25 px-4 py-6 text-sm text-white/45">
                        No prize split set yet.
                      </p>
                    )}
                  </div>
                    <input value={createLeaderboardForm.title} onChange={(event) => setCreateLeaderboardForm((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-xl border border-[#C98958]/30 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-[#C98958]" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.25em] text-white/60">Start Date</label>
                    <input type="datetime-local" value={createLeaderboardForm.startDate} onChange={(event) => setCreateLeaderboardForm((current) => ({ ...current, startDate: event.target.value }))} className="w-full rounded-xl border border-[#C98958]/30 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-[#C98958]" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.25em] text-white/60">End Date</label>
                    <input type="datetime-local" value={createLeaderboardForm.endDate} onChange={(event) => setCreateLeaderboardForm((current) => ({ ...current, endDate: event.target.value }))} className="w-full rounded-xl border border-[#C98958]/30 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-[#C98958]" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.25em] text-white/60">Total Prize</label>
                    <input type="number" value={createLeaderboardForm.totalPrize} onChange={(event) => setCreateLeaderboardForm((current) => ({ ...current, totalPrize: event.target.value }))} className="w-full rounded-xl border border-[#C98958]/30 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-[#C98958]" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.25em] text-white/60">Prize Split</label>
                    <input value={createLeaderboardForm.prizeSplit} onChange={(event) => setCreateLeaderboardForm((current) => ({ ...current, prizeSplit: event.target.value }))} placeholder="500, 300, 200" className="w-full rounded-xl border border-[#C98958]/30 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-[#C98958]" />
                    <p className="mt-2 text-xs text-white/45">Comma-separated amounts for the top ranks.</p>
                  </div>
                  <label className="flex items-center gap-3 text-sm text-white/70">
                    <input type="checkbox" checked={createLeaderboardForm.active} onChange={(event) => setCreateLeaderboardForm((current) => ({ ...current, active: event.target.checked }))} />
                    Set as active leaderboard
                  </label>
                  <button disabled={saving} className="w-full rounded-xl bg-[#930203] px-4 py-3 font-semibold text-white transition hover:bg-[#C98958] disabled:cursor-not-allowed disabled:opacity-60" type="submit">
                    {saving ? "Saving..." : "Create Leaderboard"}
                  </button>
                </form>

                {selectedLeaderboard && (
                  <form onSubmit={updateLeaderboard} className="rounded-3xl border border-[#C98958]/20 bg-[#120b0a]/80 p-5 shadow-lg shadow-black/30 space-y-4">
                    <h3 className="text-lg font-bold text-white">Edit Selected Leaderboard</h3>
                    <div>
                      <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.25em] text-white/60">Title</label>
                      <input value={editLeaderboardForm.title} onChange={(event) => setEditLeaderboardForm((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-xl border border-[#C98958]/30 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-[#C98958]" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.25em] text-white/60">Start Date</label>
                      <input type="datetime-local" value={editLeaderboardForm.startDate} onChange={(event) => setEditLeaderboardForm((current) => ({ ...current, startDate: event.target.value }))} className="w-full rounded-xl border border-[#C98958]/30 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-[#C98958]" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.25em] text-white/60">End Date</label>
                      <input type="datetime-local" value={editLeaderboardForm.endDate} onChange={(event) => setEditLeaderboardForm((current) => ({ ...current, endDate: event.target.value }))} className="w-full rounded-xl border border-[#C98958]/30 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-[#C98958]" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.25em] text-white/60">Total Prize</label>
                      <input type="number" value={editLeaderboardForm.totalPrize} onChange={(event) => setEditLeaderboardForm((current) => ({ ...current, totalPrize: event.target.value }))} className="w-full rounded-xl border border-[#C98958]/30 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-[#C98958]" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.25em] text-white/60">Prize Split</label>
                      <input value={editLeaderboardForm.prizeSplit} onChange={(event) => setEditLeaderboardForm((current) => ({ ...current, prizeSplit: event.target.value }))} placeholder="500, 300, 200" className="w-full rounded-xl border border-[#C98958]/30 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-[#C98958]" />
                      <p className="mt-2 text-xs text-white/45">Comma-separated amounts for the top ranks.</p>
                    </div>
                    <label className="flex items-center gap-3 text-sm text-white/70">
                      <input type="checkbox" checked={editLeaderboardForm.active} onChange={(event) => setEditLeaderboardForm((current) => ({ ...current, active: event.target.checked }))} />
                      Active leaderboard
                    </label>
                    <div className="flex gap-3">
                      <button disabled={saving} className="flex-1 rounded-xl bg-[#C98958] px-4 py-3 font-semibold text-white transition hover:bg-[#930203] disabled:cursor-not-allowed disabled:opacity-60" type="submit">
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                      <button disabled={saving} onClick={deleteLeaderboard} type="button" className="rounded-xl border border-red-400/40 px-4 py-3 font-semibold text-red-200 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-60">
                        Delete
                      </button>
                    </div>
                  </form>
                )}

                <form onSubmit={submitEntry} className="rounded-3xl border border-[#C98958]/20 bg-[#120b0a]/80 p-5 shadow-lg shadow-black/30 space-y-4">
                  <h3 className="text-lg font-bold text-white">Add Entry</h3>
                  <div>
                    <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.25em] text-white/60">Username</label>
                    <input value={entryForm.username} onChange={(event) => setEntryForm((current) => ({ ...current, username: event.target.value }))} className="w-full rounded-xl border border-[#C98958]/30 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-[#C98958]" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.25em] text-white/60">Wagering</label>
                    <input type="number" value={entryForm.wagering} onChange={(event) => setEntryForm((current) => ({ ...current, wagering: event.target.value }))} className="w-full rounded-xl border border-[#C98958]/30 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-[#C98958]" />
                  </div>
                  <div className="flex gap-3">
                    <button disabled={saving || !selectedLeaderboard} className="flex-1 rounded-xl bg-[#930203] px-4 py-3 font-semibold text-white transition hover:bg-[#C98958] disabled:cursor-not-allowed disabled:opacity-60" type="submit">
                      {saving ? "Saving..." : "Add Entry"}
                    </button>
                  </div>
                </form>

                <div className="rounded-3xl border border-[#C98958]/20 bg-[#120b0a]/80 p-5 shadow-lg shadow-black/30 space-y-3">
                  <h3 className="text-lg font-bold text-white">Prize Split</h3>
                  <p className="text-sm text-white/65">
                    Total Prize: <span className="font-semibold text-[#E7AC78]">{Number(selectedLeaderboard?.totalPrize ?? 0).toLocaleString()}</span>
                  </p>
                  {selectedLeaderboard?.prizeSplit?.length ? (
                    <div className="space-y-2">
                      {selectedLeaderboard.prizeSplit.map((amount, index) => (
                        <div key={`${amount}-${index}`} className="flex items-center justify-between rounded-xl border border-[#C98958]/15 bg-black/35 px-4 py-3">
                          <span className="text-sm text-white/70">Top {index + 1}</span>
                          <span className="font-semibold text-[#E7AC78]">{Number(amount).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl border border-dashed border-[#C98958]/20 bg-black/25 px-4 py-6 text-sm text-white/45">
                      No prize split set yet.
                    </p>
                  )}
                </div>
              </aside>

              <section className="overflow-hidden rounded-3xl border border-[#C98958]/20 bg-[#120b0a]/75 shadow-lg shadow-black/30">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#C98958]/15 px-5 py-4 sm:px-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-white/45">Selected leaderboard</p>
                    <h2 className="text-xl font-bold text-white">{selectedLeaderboard?.title || "No leaderboard selected"}</h2>
                  </div>
                  <div className="text-right text-xs text-white/50">
                    <p>Start: {formatDate(selectedLeaderboard?.startDate)}</p>
                    <p>End: {formatDate(selectedLeaderboard?.endDate)}</p>
                  </div>
                </div>

                {pageLoading && <div className="px-4 py-16 text-center text-white/60">Loading leaderboards...</div>}
                {pageError && !pageLoading && <div className="px-4 py-8 text-center text-red-300">{pageError}</div>}

                {!pageLoading && !pageError && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-black/40 text-[#E7AC78]">
                        <tr>
                          <th className="px-4 py-4 text-left font-semibold uppercase tracking-[0.2em]">Rank</th>
                          <th className="px-4 py-4 text-left font-semibold uppercase tracking-[0.2em]">Username</th>
                          <th className="px-4 py-4 text-left font-semibold uppercase tracking-[0.2em]">Wagering</th>
                          <th className="px-4 py-4 text-left font-semibold uppercase tracking-[0.2em]">Prize</th>
                          <th className="px-4 py-4 text-left font-semibold uppercase tracking-[0.2em]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedLeaderboard?.entries.length ? (
                          selectedLeaderboard.entries.map((entry, index) => (
                            <tr key={entry._id} className={`border-t border-[#C98958]/10 ${index % 2 === 0 ? "bg-black/20" : "bg-black/35"}`}>
                              <td className="px-4 py-4 font-bold text-[#C98958]">#{index + 1}</td>
                              {editingEntryId === entry._id ? (
                                <>
                                  <td className="px-3 py-3">
                                    <input value={entryForm.username} onChange={(event) => setEntryForm((current) => ({ ...current, username: event.target.value }))} className="w-full rounded-lg border border-[#C98958]/30 bg-black/60 px-3 py-2 text-sm text-white outline-none transition focus:border-[#C98958]" />
                                  </td>
                                  <td className="px-3 py-3">
                                    <input type="number" value={entryForm.wagering} onChange={(event) => setEntryForm((current) => ({ ...current, wagering: event.target.value }))} className="w-full rounded-lg border border-[#C98958]/30 bg-black/60 px-3 py-2 text-sm text-white outline-none transition focus:border-[#C98958]" />
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="px-4 py-4 font-medium text-white">{entry.username}</td>
                                  <td className="px-4 py-4 font-semibold text-[#E7AC78]">{Number(entry.wagering || 0).toLocaleString()}</td>
                                  <td className="px-4 py-4 font-semibold text-white">{Number(entry.prize || 0).toLocaleString()}</td>
                                </>
                              )}
                              <td className="px-4 py-4">
                                <div className="flex flex-wrap gap-2">
                                  {editingEntryId === entry._id ? (
                                    <>
                                      <button type="button" disabled={saving} onClick={saveInlineEntry} className="rounded-lg bg-[#C98958] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#930203] disabled:cursor-not-allowed disabled:opacity-60">
                                        Save
                                      </button>
                                      <button type="button" disabled={saving} onClick={cancelEditEntry} className="rounded-lg border border-[#C98958]/25 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60">
                                        Cancel
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button type="button" disabled={saving} onClick={() => startEditEntry(entry)} className="rounded-lg border border-[#C98958]/25 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60">
                                        Edit
                                      </button>
                                      <button type="button" disabled={saving} onClick={() => deleteEntry(entry._id, entry.username)} className="rounded-lg bg-[#930203] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#C98958] disabled:cursor-not-allowed disabled:opacity-60">
                                        Delete
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-16 text-center text-white/50">
                              No users have been added to this leaderboard yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
