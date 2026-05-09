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
  rank?: number;
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
  createdAt?: string;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function ShuffleMonthly() {
  const [leaderboards, setLeaderboards] = useState<ShuffleLeaderboard[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/api/shuffle-leaderboards`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load leaderboards");
        const rows = Array.isArray(data) ? data : [];
        setLeaderboards(rows);
        setSelectedId((current) => {
          if (current && rows.some((row) => row._id === current)) return current;
          return rows[0]?._id || "";
        });
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const selectedLeaderboard = useMemo(
    () => leaderboards.find((leaderboard) => leaderboard._id === selectedId) || leaderboards[0] || null,
    [leaderboards, selectedId]
  );

  const entries = selectedLeaderboard?.entries || [];
  const totalPrize = selectedLeaderboard?.totalPrize ?? entries.reduce((sum, entry) => sum + Number(entry.prize || 0), 0);
  const totalWagering = selectedLeaderboard?.totalWagering || entries.reduce((sum, entry) => sum + Number(entry.wagering || 0), 0);
  const prizeSplit = selectedLeaderboard?.prizeSplit || [];

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden overflow-hidden text-white">
      <GraphicalBackground />
      <Navbar />

      <main className="relative z-10 flex-grow px-4 py-8 sm:px-6 lg:px-8">
        <section className="mx-auto w-full max-w-7xl">
          <div className="overflow-hidden rounded-[2rem] border border-[#C98958]/25 bg-black/55 shadow-2xl shadow-black/40 backdrop-blur-md">
            <div className="border-b border-[#C98958]/20 bg-gradient-to-r from-[#930203] to-[#C98958]/70 px-6 py-8 sm:px-10">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/75">Shuffle Leaderboard</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-5xl">Clash Table</h1>
              <p className="mt-3 max-w-3xl text-sm text-white/80 sm:text-base">
                View the leaderboard classement, wagering totals, prize distribution, and event dates in one place.
              </p>
            </div>

            <div className="grid gap-4 border-b border-[#C98958]/15 px-6 py-6 sm:grid-cols-2 xl:grid-cols-5 sm:px-10">
              <div className="rounded-2xl border border-[#C98958]/20 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-white/45">Leaderboard</p>
                <p className="mt-2 text-lg font-bold text-[#E7AC78]">{selectedLeaderboard?.title || "No leaderboard"}</p>
              </div>
              <div className="rounded-2xl border border-[#C98958]/20 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-white/45">Start Date</p>
                <p className="mt-2 text-sm font-semibold text-white">{formatDate(selectedLeaderboard?.startDate)}</p>
              </div>
              <div className="rounded-2xl border border-[#C98958]/20 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-white/45">End Date</p>
                <p className="mt-2 text-sm font-semibold text-white">{formatDate(selectedLeaderboard?.endDate)}</p>
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

                <div className="rounded-3xl border border-[#C98958]/20 bg-[#120b0a]/80 p-5 shadow-lg shadow-black/30">
                  <h3 className="text-lg font-bold text-white">Event Info</h3>
                  <div className="mt-4 space-y-3 text-sm text-white/75">
                    <p><span className="text-white/45">Status:</span> {selectedLeaderboard?.active ? "Active" : "Archived"}</p>
                    <p><span className="text-white/45">Entries:</span> {entries.length}</p>
                    <p><span className="text-white/45">Created:</span> {formatDate(selectedLeaderboard?.createdAt)}</p>
                  </div>
                </div>

                <div className="rounded-3xl border border-[#C98958]/20 bg-[#120b0a]/80 p-5 shadow-lg shadow-black/30">
                  <h3 className="text-lg font-bold text-white">Leaderboard Notes</h3>
                  <p className="mt-3 text-sm leading-6 text-white/55">
                    The table is ordered by wagering, and prizes follow the split you define for the top ranks.
                  </p>
                </div>

                <div className="rounded-3xl border border-[#C98958]/20 bg-[#120b0a]/80 p-5 shadow-lg shadow-black/30 space-y-3">
                  <h3 className="text-lg font-bold text-white">Prize Split</h3>
                  {prizeSplit.length ? (
                    <div className="space-y-2">
                      {prizeSplit.map((amount, index) => (
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
                {loading && (
                  <div className="px-4 py-16 text-center text-white/60">Loading leaderboard...</div>
                )}
                {error && !loading && (
                  <div className="px-4 py-16 text-center text-red-300">{error}</div>
                )}
                {!loading && !error && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-black/40 text-[#E7AC78]">
                        <tr>
                          <th className="px-4 py-4 text-left font-semibold uppercase tracking-[0.2em]">Rank</th>
                          <th className="px-4 py-4 text-left font-semibold uppercase tracking-[0.2em]">Username</th>
                          <th className="px-4 py-4 text-left font-semibold uppercase tracking-[0.2em]">Wager</th>
                          <th className="px-4 py-4 text-left font-semibold uppercase tracking-[0.2em]">Prize</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.length > 0 ? (
                          entries.map((entry, index) => (
                            <tr
                              key={entry._id}
                              className={`border-t border-[#C98958]/10 ${
                                index < 3 ? "bg-[#930203]/15" : index % 2 === 0 ? "bg-black/20" : "bg-black/35"
                              }`}
                            >
                              <td className="px-4 py-4 font-bold text-[#C98958]">#{entry.rank || index + 1}</td>
                              <td className="px-4 py-4 font-medium text-white">{entry.username}</td>
                              <td className="px-4 py-4 font-semibold text-[#E7AC78]">{Number(entry.wagering || 0).toLocaleString()}</td>
                              <td className="px-4 py-4 font-semibold text-white">{Number(entry.prize || 0).toLocaleString()}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-4 py-16 text-center text-white/50">
                              No entries have been added to this leaderboard yet.
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
