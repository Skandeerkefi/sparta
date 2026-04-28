import { create } from "zustand";
import axios from "axios";
import { API_BASE } from "@/lib/api";

interface Reward {
  type: string;
  amount: number;
}

interface Player {
  name: string;
  userId: number;
  xp: number;
   // Use the property from your API
  depositsGems: number;
  avatar?: string;
  earned?: number;
  wagered?: number;
}

interface ClashState {
  players: Player[];
  rewards: Reward[];
  startDate: Date | null;
  endDate: Date | null;
  loading: boolean;
  error: string | null;
  fetchLeaderboard: () => Promise<void>;
}

export const useClashStore = create<ClashState>((set) => ({
  players: [],
  rewards: [],
  startDate: null,
  endDate: null,
  loading: false,
  error: null,

  fetchLeaderboard: async () => {
    set({ loading: true, error: null });

    try {
      const { data } = await axios.get(
        `${API_BASE}/api/leaderboard/clash/leaderboards`
      );

      // Convert startDate/endDate strings to Date objects
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);

      set({
        players: data.players,
        rewards: data.rewards,
        startDate: isNaN(startDate.getTime()) ? null : startDate,
        endDate: isNaN(endDate.getTime()) ? null : endDate,
        loading: false,
        error: null,
      });
    } catch (err: any) {
      set({
        players: [],
        rewards: [],
        startDate: null,
        endDate: null,
        loading: false,
        error: err.message || "Failed to fetch leaderboard",
      });
    }
  },
}));
