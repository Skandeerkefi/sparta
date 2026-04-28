import { create } from "zustand";

interface LeaderboardEntry {
  rank: number;
  name: string;
  wagered: number;
  prize: number;
}

interface CSGOLeadState {
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  dateStart: string;
  dateEnd: string;
  fetchLeaderboard: (take?: number) => Promise<void>;
}

export const useCSGOLeadStore = create<CSGOLeadState>((set) => ({
  leaderboard: [],
  loading: false,
  error: null,

  // NEW LEADERBOARD PERIOD
  dateStart: "2025-12-05T00:00:00Z",
  dateEnd: "2025-12-20T00:00:00Z",

  fetchLeaderboard: async (take = 10) => {
    set({ loading: true, error: null });

    try {
      const res = await fetch(
        `https://bswrxstidata-production.up.railway.app/api/leaderboard/csgowin`
      );

      if (!res.ok) throw new Error("Failed to fetch leaderboard");

      const data = await res.json();

      // use LAST leaderboard (current active)
      const lb = data.leaderboards?.[0];

      if (!lb) throw new Error("No leaderboard found");

      const users = lb.users || [];
      const prizes = lb.prizes || [];

      const mapped: LeaderboardEntry[] = users.map((u: any, idx: number) => ({
        rank: u.rank || idx + 1,
        name: u.username || u.name || "Unknown",
        wagered: u.wagered || 0,
        prize: prizes[idx] || 0,
      }));

      set({
        leaderboard: mapped.slice(0, take),
        loading: false,

        // API > fallback
        dateStart: lb.dateStart || "2025-12-05T00:00:00Z",
        dateEnd: lb.dateEnd || "2025-12-20T00:00:00Z",
      });
    } catch (err: any) {
      set({ error: err.message || "Unknown error", loading: false });
    }
  },
}));
