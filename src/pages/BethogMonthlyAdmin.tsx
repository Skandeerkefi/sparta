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

export default function BethogMonthlyAdmin() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [name, setName] = useState("");
  const [wagering, setWagering] = useState(0);
  const [entries, setEntries] = useState<MonthlyEntryItem[]>([]);
  const [prizesInput, setPrizesInput] = useState("");

  const prizeValues = useMemo(
    () =>
      prizesInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((value) => Number(value) || 0),
    [prizesInput]
  );

  const totalPrize = useMemo(
    () => prizeValues.reduce((sum, value) => sum + value, 0),
    [prizeValues]
  );

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/monthly-leaderboard/${month}/entries`);
      const data = await res.json();
      setEntries(data || []);
      const pRes = await fetch(`${API_BASE}/api/monthly-leaderboard/${month}/prizes`);
      const pData = await pRes.json();
      setPrizesInput((pData.prizes || []).join(", "));
    } catch (err) {
      console.error(err);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const addEntry = async (e) => {
    e.preventDefault();
    await fetch(`${API_BASE}/api/monthly-leaderboard/${month}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, wagering }),
    });
    setName("");
    setWagering(0);
    load();
  };

  const remove = async (id) => {
    await fetch(`${API_BASE}/api/monthly-leaderboard/entries/${id}`, { method: "DELETE" });
    load();
  };

  const savePrizes = async (e) => {
    e.preventDefault();
    await fetch(`${API_BASE}/api/monthly-leaderboard/${month}/prizes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prizes: prizeValues }),
    });
    load();
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden text-white">
      <GraphicalBackground />
      <Navbar />

      <main className="relative z-10 flex-grow px-4 py-10 sm:px-6 lg:px-8">
        <section className="mx-auto w-full max-w-7xl">
          <div className="overflow-hidden rounded-[2rem] border border-[#C98958]/25 bg-black/55 shadow-2xl shadow-black/40 backdrop-blur-md">
            <div className="border-b border-[#C98958]/20 bg-gradient-to-r from-[#930203] to-[#C98958]/70 px-6 py-8 sm:px-10">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/75">Admin Control</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-5xl">Bethog Monthly Manager</h1>
              <p className="mt-3 max-w-3xl text-sm text-white/80 sm:text-base">
                Add players manually, adjust wagering, and publish prize amounts without relying on an external API.
              </p>
            </div>

            <div className="grid gap-4 border-b border-[#C98958]/15 px-6 py-6 sm:grid-cols-4 sm:px-10">
              <div className="rounded-2xl border border-[#C98958]/20 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-white/45">Month</p>
                <p className="mt-2 text-xl font-bold text-[#E7AC78]">{month}</p>
              </div>
              <div className="rounded-2xl border border-[#C98958]/20 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-white/45">Players</p>
                <p className="mt-2 text-xl font-bold text-white">{entries.length}</p>
              </div>
              <div className="rounded-2xl border border-[#C98958]/20 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-white/45">Prize Slots</p>
                <p className="mt-2 text-xl font-bold text-white">{prizeValues.length}</p>
              </div>
              <div className="rounded-2xl border border-[#C98958]/20 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-white/45">Prize Pool</p>
                <p className="mt-2 text-xl font-bold text-[#C98958]">{totalPrize.toLocaleString()}</p>
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

                <form onSubmit={addEntry} className="rounded-3xl border border-[#C98958]/20 bg-[#120b0a]/80 p-5 shadow-lg shadow-black/30 space-y-4">
                  <h3 className="text-lg font-bold text-white">Add Player</h3>
                  <div>
                    <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.25em] text-white/60">Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-[#C98958]/30 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-[#C98958]" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.25em] text-white/60">Wagering</label>
                    <input type="number" value={wagering} onChange={(e) => setWagering(Number(e.target.value))} className="w-full rounded-xl border border-[#C98958]/30 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-[#C98958]" />
                  </div>
                  <button className="w-full rounded-xl bg-[#C98958] px-4 py-3 font-semibold text-white transition hover:bg-[#930203]" type="submit">
                    Add Entry
                  </button>
                </form>

                <form onSubmit={savePrizes} className="rounded-3xl border border-[#C98958]/20 bg-[#120b0a]/80 p-5 shadow-lg shadow-black/30 space-y-4">
                  <h3 className="text-lg font-bold text-white">Prize Setup</h3>
                  <label className="block text-sm font-semibold uppercase tracking-[0.25em] text-white/60">Prizes</label>
                  <input
                    value={prizesInput}
                    onChange={(e) => setPrizesInput(e.target.value)}
                    className="w-full rounded-xl border border-[#C98958]/30 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-[#C98958]"
                    placeholder="500, 300, 200"
                  />
                  <p className="text-sm text-white/50">Use comma-separated amounts in rank order.</p>
                  <div className="flex flex-wrap gap-2">
                    {prizeValues.map((value, index) => (
                      <span key={`${value}-${index}`} className="rounded-full border border-[#C98958]/25 bg-black/35 px-3 py-1 text-xs text-[#E7AC78]">
                        #{index + 1} {Number(value).toLocaleString()}
                      </span>
                    ))}
                  </div>
                  <button className="w-full rounded-xl bg-[#930203] px-4 py-3 font-semibold text-white transition hover:bg-[#C98958]" type="submit">
                    Save Prizes
                  </button>
                </form>
              </aside>

              <section className="overflow-hidden rounded-3xl border border-[#C98958]/20 bg-[#120b0a]/75 shadow-lg shadow-black/30">
                <div className="flex items-center justify-between border-b border-[#C98958]/15 px-5 py-4 sm:px-6">
                  <div />
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-black/40 text-[#E7AC78]">
                      <tr>
                        <th className="px-4 py-4 text-left font-semibold uppercase tracking-[0.2em]">Name</th>
                        <th className="px-4 py-4 text-left font-semibold uppercase tracking-[0.2em]">Wagering</th>
                        <th className="px-4 py-4 text-left font-semibold uppercase tracking-[0.2em]">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.length > 0 ? (
                        entries.map((en, idx: number) => (
                          <tr key={en._id} className={`border-t border-[#C98958]/10 ${idx % 2 === 0 ? "bg-black/20" : "bg-black/35"}`}>
                            <td className="px-4 py-4 font-medium text-white">{en.name}</td>
                            <td className="px-4 py-4 font-semibold text-[#E7AC78]">{Number(en.wagering).toLocaleString()}</td>
                            <td className="px-4 py-4">
                              <button onClick={() => remove(en._id)} className="rounded-lg bg-[#930203] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#C98958]">
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-4 py-16 text-center text-white/50">
                            No manual entries yet. Add players from the panel on the left.
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
