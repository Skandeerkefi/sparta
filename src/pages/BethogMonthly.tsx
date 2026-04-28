import React, { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE } from "@/lib/api";
import GraphicalBackground from "@/components/GraphicalBackground";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface MonthlyEntryItem {
  _id: string;
  name: string;
  wagering: number;
}

export default function BethogMonthly() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [entries, setEntries] = useState<MonthlyEntryItem[]>([]);
  const [prizes, setPrizes] = useState<number[]>([]);

  const totalPrize = useMemo(
    () => prizes.reduce((sum: number, prize: number) => sum + (Number(prize) || 0), 0),
    [prizes]
  );

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/monthly-leaderboard/${month}/entries`);
      const data = await res.json();
      setEntries(data || []);
      const pRes = await fetch(`${API_BASE}/api/monthly-leaderboard/${month}/prizes`);
      const pData = await pRes.json();
      setPrizes((pData.prizes || []).map((prize: number | string) => Number(prize) || 0));
    } catch (err) {
      console.error(err);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden overflow-hidden text-white">
      <GraphicalBackground />
      <Navbar />

      <main className="relative z-10 flex-grow px-4 py-8 sm:px-6 lg:px-8">
        <section className="w-full mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-[2rem] border border-[#C98958]/25 bg-black/55 shadow-2xl shadow-black/40 backdrop-blur-md">
            <div className="border-b border-[#C98958]/20 bg-gradient-to-r from-[#930203] to-[#C98958]/70 px-6 py-8 sm:px-10">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/75">Bethog Monthly</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-5xl">Monthly Leaderboard</h1>
              <p className="max-w-3xl mt-3 text-sm text-white/80 sm:text-base">
                Manual monthly standings, prize distribution, and ranking updates controlled from the admin panel.
              </p>
            </div>

            <div className="grid gap-4 border-b border-[#C98958]/15 px-6 py-6 sm:grid-cols-2 lg:grid-cols-3 sm:px-10">
              <div className="rounded-2xl border border-[#C98958]/20 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-white/45">Current Month</p>
                <p className="mt-2 text-2xl font-bold text-[#E7AC78]">{month}</p>
              </div>
              
              <div className="rounded-2xl border border-[#C98958]/20 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-white/45">Prize Pool</p>
                <p className="mt-2 text-2xl font-bold text-[#C98958]">{totalPrize.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid gap-6 px-6 py-6 lg:grid-cols-[360px_1fr] lg:px-10 lg:py-10">
              <aside className="space-y-6">
                <div className="rounded-3xl border border-[#C98958]/20 bg-[#120b0a]/80 p-5 shadow-lg shadow-black/30">
                  <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.25em] text-white/60">Month</label>
                  <input
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full rounded-xl border border-[#C98958]/30 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-[#C98958]"
                  />
                  <p className="mt-3 text-sm text-white/50">Format: YYYY-MM</p>
                </div>

                <div className="rounded-3xl border border-[#C98958]/20 bg-[#120b0a]/80 p-5 shadow-lg shadow-black/30">
                  <h3 className="text-lg font-bold text-white">Prize List</h3>
                  <div className="mt-4 space-y-2">
                    {prizes.length > 0 ? (
                      prizes.map((p: number, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-xl border border-[#C98958]/15 bg-black/35 px-4 py-3"
                        >
                          <span className="text-sm text-white/70">Rank {i + 1}</span>
                          <span className="font-semibold text-[#E7AC78]">{Number(p).toLocaleString()}</span>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-xl border border-dashed border-[#C98958]/20 bg-black/25 px-4 py-6 text-sm text-white/45">
                        No prizes set for this month yet.
                      </p>
                    )}
                  </div>
                </div>
              </aside>

              <section className="overflow-hidden rounded-3xl border border-[#C98958]/20 bg-[#120b0a]/75 shadow-lg shadow-black/30">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-black/40 text-[#E7AC78]">
                      <tr>
                        <th className="px-4 py-4 text-left font-semibold uppercase tracking-[0.2em]">Rank</th>
                        <th className="px-4 py-4 text-left font-semibold uppercase tracking-[0.2em]">Name</th>
                        <th className="px-4 py-4 text-left font-semibold uppercase tracking-[0.2em]">Wagering</th>
                        <th className="px-4 py-4 text-left font-semibold uppercase tracking-[0.2em]">Prize</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.length > 0 ? (
                        entries.map((en: MonthlyEntryItem, idx: number) => (
                          <tr
                            key={en._id}
                            className={`border-t border-[#C98958]/10 ${
                              idx < 3 ? "bg-[#930203]/15" : idx % 2 === 0 ? "bg-black/20" : "bg-black/35"
                            }`}
                          >
                            <td className="px-4 py-4 font-bold text-[#C98958]">#{idx + 1}</td>
                            <td className="px-4 py-4 font-medium text-white">{en.name}</td>
                            <td className="px-4 py-4 font-semibold text-[#E7AC78]">{Number(en.wagering).toLocaleString()}</td>
                            <td className="px-4 py-4 font-semibold text-white">{prizes[idx] ? Number(prizes[idx]).toLocaleString() : "—"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-16 text-center text-white/50">
                            No manual entries have been added yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
