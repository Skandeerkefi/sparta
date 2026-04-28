import React, { useEffect, useState } from "react";
import GraphicalBackground from "@/components/GraphicalBackground";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useClashStore } from "@/store/clashStore";

const ClashLeaderboardPage = () => {
  const { players, startDate, endDate, rewards, loading, error, fetchLeaderboard } = useClashStore();
  const [countdown, setCountdown] = useState<string>("");

  // Fetch leaderboard on mount
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Countdown timer
  useEffect(() => {
    if (!endDate) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endDate.getTime() - now;

      if (distance <= 0) {
        setCountdown("Leaderboard period ended");
        clearInterval(timer);
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  const formatDate = (date: Date | null) => {
    if (!date || isNaN(date.getTime())) return "Invalid date";
    return date.toISOString().split("T")[0];
  };

  // Sort players by wagered descending
  const sortedPlayers = (players || []).sort((a, b) => (b.wagered || 0) - (a.wagered || 0));

  return (
    <div className="relative min-h-screen flex flex-col">
      <GraphicalBackground />
      <Navbar />

      <main className="flex-grow container mx-auto p-4 relative z-10">
        <h1 className="text-3xl font-bold mb-2 text-center text-white">
          Clash Leaderboard
        </h1>

        {loading && !error && <p className="text-center text-white">Loading leaderboard...</p>}
        {error && <p className="text-center text-[#C98958]">Error: {error}</p>}

        {!loading && !error && startDate && endDate && (
          <p className="text-center text-white mb-4">
            Period: {formatDate(startDate)} → {formatDate(endDate)} | Next update in: {countdown}
          </p>
        )}

        {!loading && !error && sortedPlayers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0 text-white shadow-xl rounded-xl overflow-hidden backdrop-blur-xl bg-white/5">
              <thead>
                <tr className="bg-gradient-to-r from-[#930203] to-[#0F0604] text-white">
                  <th className="p-3 border-b border-[#C98958] font-semibold text-center">Place</th>
                  <th className="p-3 border-b border-[#C98958] font-semibold">Username</th>
                  <th className="p-3 border-b border-[#C98958] font-semibold text-center">Wagered</th>
                  <th className="p-3 border-b border-[#C98958] font-semibold text-center">Prize</th>
                </tr>
              </thead>

              <tbody>
  {sortedPlayers.map((player, index) => (
    <tr
      key={player.userId}
      className={`transition duration-200 hover:bg-[#0F0604]/40 ${index % 2 === 0 ? "bg-white/5" : "bg-white/10"}`}
    >
      <td className="p-3 border-b border-gray-700 text-center font-semibold text-[#C98958]">
        #{index + 1}
      </td>
      <td className="p-3 border-b border-gray-700 font-medium">{player.name}</td>
      <td className="p-3 border-b border-gray-700 text-center font-mono">
        {(player.wagered / 100).toFixed(2)}
      </td>
      <td className="p-3 border-b border-gray-700 text-center font-semibold text-yellow-300">
        {(rewards && rewards[index] ? rewards[index].amount / 100 : 0).toFixed(2)}
      </td>
    </tr>
  ))}
</tbody>

            </table>
          </div>
        )}

        {!loading && !error && sortedPlayers.length === 0 && (
          <p className="text-center text-white">No players found for this period.</p>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ClashLeaderboardPage;
