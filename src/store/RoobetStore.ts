import { create } from "zustand";
import axios from "axios";
import dayjs from "dayjs";

import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

interface Player {
	uid: string;
	username: string;
	wagered: number;
	weightedWagered: number;
	favoriteGameId: string;
	favoriteGameTitle: string;
	rankLevel: number;
}

interface LeaderboardData {
	disclosure: string;
	data: Player[];
}

interface PeriodInfo {
	startDate: string;
	endDate: string;
	start: dayjs.Dayjs;
	end: dayjs.Dayjs;
}

interface RoobetStore {
	leaderboard: LeaderboardData | null;
	loading: boolean;
	error: string | null;
	periodInfo: PeriodInfo | null;
	fetchLeaderboard: () => Promise<void>;
}

/**
 * Calculate monthly leaderboard period in UTC.
 */
const getMonthlyPeriod = (): PeriodInfo => {
	const now = dayjs().utc();
	const start = now.startOf("month");
	const end = now.endOf("month");

	return {
		startDate: start.format("YYYY-MM-DD"),
		endDate: end.format("YYYY-MM-DD"),
		start,
		end,
	};
};

export const useRoobetStore = create<RoobetStore>((set) => ({
	leaderboard: null,
	loading: false,
	error: null,
	periodInfo: null,

	fetchLeaderboard: async () => {
		set({ loading: true, error: null });

		try {
			const periodInfo = getMonthlyPeriod();
			const { startDate, endDate } = periodInfo;
			set({ periodInfo });

			let url = `https://bswrxstidata-production.up.railway.app/api/leaderboard/${startDate}/${endDate}`;

			const response = await axios.get(url);

			const updatedData: LeaderboardData = {
				disclosure: response.data.disclosure,
				data: response.data.data.map((player: any, index: number) => ({
					uid: player.uid,
					username: player.username,
					wagered: player.wagered,
					weightedWagered: player.weightedWagered,
					favoriteGameId: player.favoriteGameId,
					favoriteGameTitle: player.favoriteGameTitle,
					rankLevel: index + 1,
				})),
			};

			set({ leaderboard: updatedData, loading: false });
		} catch (err: any) {
			set({
				error: err.response?.data?.error || "Failed to fetch leaderboard",
				loading: false,
			});
		}
	},
}));
