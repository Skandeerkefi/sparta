import { create } from "zustand";
import axios from "axios";

export type LeaderboardUser = {
	id: string;
	username: string;
	avatar?: string;
	wagered: number;
	deposited: number;
};

type RainStore = {
	leaderboard: LeaderboardUser[];
	loading: boolean;
	error: string | null;
	fetchLeaderboard: (
		start_date: string,
		end_date: string,
		type: "wagered" | "deposited"
	) => Promise<void>;
};

export const useRainStore = create<RainStore>((set) => ({
	leaderboard: [],
	loading: false,
	error: null,

	fetchLeaderboard: async (start_date, end_date, type) => {
		try {
			set({ loading: true, error: null });
			const res = await axios.get(
				"http://localhost:3000/rain",
				{
					params: { start_date, end_date, type },
				}
			);
			set({ leaderboard: res.data.results || [], loading: false });
		} catch (err: any) {
			set({ error: err.message, loading: false });
		}
	},
}));
