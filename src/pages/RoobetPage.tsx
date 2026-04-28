import React, { useEffect, useState } from "react";
import { useRoobetStore } from "../store/RoobetStore";
import GraphicalBackground from "@/components/GraphicalBackground";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import utc from "dayjs/plugin/utc";

dayjs.extend(duration);
dayjs.extend(utc);

const RoobetPage: React.FC = () => {
  const { leaderboard, loading, error, fetchLeaderboard, periodInfo } = useRoobetStore();
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // $500 monthly pool split
  const prizeMap: Record<number, string> = {
    1: "$250",
    2: "$125",
    3: "$75",
    4: "$30",
    5: "$20",
  };

  // ⏳ Countdown (UTC-based, bi-weekly)
  useEffect(() => {
    const updateCountdown = () => {
      if (!periodInfo) return;

      const now = dayjs().utc();
      const end = periodInfo.end;
      const diff = end.diff(now);

      if (diff <= 0) {
        setTimeLeft("Leaderboard period has ended. Resetting monthly...");
        return;
      }

      const d = dayjs.duration(diff);

      const days = Math.floor(d.asDays());
      const hours = d.hours();
      const minutes = d.minutes();
      const seconds = d.seconds();

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    if (!periodInfo) return;
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [periodInfo]);

  return (
    <div className="relative flex flex-col min-h-screen">
      <GraphicalBackground />
      <Navbar />

      <main className="relative z-10 flex-grow w-full max-w-6xl px-6 py-16 mx-auto">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <h1 className="mb-6 text-5xl md:text-6xl font-black text-[#E7AC78] uppercase drop-shadow-[0_0_20px_rgba(255,253,222,0.22)]">
            Bethog Monthly Leaderboard
          </h1>
          <div className="w-24 h-1 mx-auto bg-gradient-to-r from-transparent via-[#C98958] to-transparent mb-8" />
          
          <div className="inline-block px-8 py-4 rounded-2xl bg-[#930203]/40 border border-[#C98958]/40 backdrop-blur-sm">
            <p className="text-2xl font-bold text-[#E7AC78]">
              💰 $500 Monthly Prize Pool
            </p>
          </div>
        </div>

        {/* Event Info Card */}
        <div className="mb-12 p-8 rounded-3xl bg-gradient-to-r from-[#930203]/50 to-[#0F0604]/50 border border-[#C98958]/30 backdrop-blur-md">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="text-center md:text-left">
              <p className="text-sm uppercase tracking-widest text-[#E7AC78]/70 mb-2">Monthly Period</p>
              <p className="text-xl font-bold text-[#E7AC78]">
                {periodInfo?.startDate} <span className="text-[#C98958]">→</span> {periodInfo?.endDate}
              </p>
              <p className="text-xs text-[#E7AC78]/50 mt-1">UTC Timezone</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm uppercase tracking-widest text-[#E7AC78]/70 mb-2">Time Remaining</p>
              <p className="text-xl font-bold font-mono text-[#C98958]">{timeLeft}</p>
              <p className="text-xs text-[#E7AC78]/50 mt-1">Until Monthly Reset</p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-64">
            <p className="text-lg text-[#E7AC78]">Loading leaderboard...</p>
          </div>
        )}
        {error && (
          <div className="p-6 text-center rounded-2xl bg-[#C98958]/20 border border-[#C98958]/50">
            <p className="text-[#C98958] font-semibold">{error}</p>
          </div>
        )}

        {leaderboard && (
          <>
            <p className="mb-10 text-xs italic text-[#E7AC78]/60 text-center px-6 py-3 bg-[#0F0604]/50 rounded-xl border border-[#E7AC78]/10">
              {leaderboard.disclosure}
            </p>

            {/* 🏆 Top 3 Champions */}
            <div className="mb-16">
              <h2 className="mb-8 text-2xl font-bold text-[#E7AC78] uppercase tracking-wide">
                🏆 Top Champions
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {leaderboard.data.slice(0, 3).map((player, idx) => (
                <div
                  key={player.uid}
                  className={`relative p-8 rounded-3xl border-2 border-[#C98958] shadow-2xl bg-gradient-to-br from-[#C98958]/20 to-[#0F0604]/60 backdrop-blur-sm hover:border-[#E7AC78] hover:shadow-[0_0_30px_rgba(210,117,143,0.5)] transition-all duration-300 group ${
                    idx === 0 ? "md:order-2" : idx === 1 ? "md:order-1" : "md:order-3"
                  }`}
                >
                  {/* Rank Badge */}
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-[#C98958] to-[#930203] border-2 border-[#E7AC78] font-black text-lg text-[#E7AC78] shadow-lg">
                    #{player.rankLevel}
                  </div>

                  <div className="pt-4 text-center">
                    <p className="text-3xl md:text-4xl font-black text-[#E7AC78] mb-4 drop-shadow-lg group-hover:text-[#C98958] transition-colors">
                      {player.username}
                    </p>

                    <div className="h-1 w-12 mx-auto bg-gradient-to-r from-transparent via-[#C98958] to-transparent mb-4" />

                    {prizeMap[player.rankLevel] && (
                      <p className="text-2xl font-bold text-[#E7AC78] mb-6">
                        💰 {prizeMap[player.rankLevel]}
                      </p>
                    )}

                    <div className="pt-4 border-t border-[#C98958]/30">
                      <p className="text-sm uppercase tracking-wider text-[#E7AC78]/70 mb-1">Wagered</p>
                      <p className="text-xl font-bold text-[#C98958] font-mono">
                        ${player.weightedWagered.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>

            {/* Remaining players (4+) */}
            {leaderboard.data.length > 3 && (
              <div className="mt-16">
                <h2 className="mb-8 text-2xl font-bold text-[#E7AC78] uppercase tracking-wide">
                  📊 Full Leaderboard
                </h2>
                <div className="overflow-x-auto rounded-2xl shadow-2xl border border-[#C98958]/30">
                  <table className="w-full text-left border-collapse">
                    <thead className="text-sm font-bold tracking-widest text-[#0F0604] uppercase bg-gradient-to-r from-[#C98958] to-[#C98958]/80">
                      <tr>
                        <th className="p-4">Rank</th>
                        <th className="p-4">Username</th>
                        <th className="p-4 text-right">Wagered</th>
                        <th className="p-4 text-right">Prize</th>
                      </tr>
                    </thead>
                  <tbody className="bg-[#0F0604]/60 backdrop-blur-sm">
                    {leaderboard.data.slice(3).map((player, idx) => (
                      <tr
                        key={player.uid}
                        className={`border-t border-[#C98958]/20 transition-colors ${
                          idx % 2 === 0 ? "bg-[#0F0604]/40" : "bg-[#930203]/20"
                        } hover:bg-[#C98958]/15`}
                      >
                        <td className="p-4 font-bold text-[#E7AC78] w-12">{player.rankLevel}</td>
                        <td className="p-4 font-semibold text-[#E7AC78]">{player.username}</td>
                        <td className="p-4 text-right text-[#E7AC78] font-mono">
                          ${player.weightedWagered.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="p-4 text-right font-bold text-[#C98958]">
                          {prizeMap[player.rankLevel] ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            )}
          </>
        )}

      </main>

      <Footer />
    </div>
  );
};

export default RoobetPage;
