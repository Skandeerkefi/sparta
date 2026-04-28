import { create } from "zustand";

export type LeaderboardPeriod = "biweekly";

export interface LeaderboardPlayer {
	rank: number;
	username: string;
	wager: number;
	isFeatured?: boolean;
}

interface PeriodInfo {
	start_at: string;
	end_at: string;
	startDate: Date;
	endDate: Date;
}

interface LeaderboardState {
	monthlyLeaderboard: LeaderboardPlayer[];
	period: LeaderboardPeriod;
	isLoading: boolean;
	error: string | null;
	periodInfo: PeriodInfo | null;
	setPeriod: (period: LeaderboardPeriod) => void;
	fetchLeaderboard: () => Promise<void>;
}

const API_URL =
	"https://bswrxstidata-production.up.railway.app/api/affiliates";

/**
 * Calculate bi-weekly period dates
 * Leaderboard period: Bi-weekly (every 2 weeks)
 * Started: March 21, 2026 12am EST (17:00 UTC on March 20)
 * Currently running: March 21, 2026 - April 4, 2026
 * Auto-resets every 14 days
 */
const getDateRange = (
	period: LeaderboardPeriod
): PeriodInfo => {
	// Reference start: March 21, 2026 12am EST
	// In UTC: March 21, 2026 5am (EST is UTC-5)
	const referenceStart = new Date("2026-03-21T05:00:00Z");
	const now = new Date();

	if (period === "biweekly") {
		// Calculate which bi-weekly period we're in
		const timeDiff = now.getTime() - referenceStart.getTime();
		const daysElapsed = timeDiff / (1000 * 60 * 60 * 24);
		const periodNumber = Math.floor(daysElapsed / 14);

		// Calculate start of current period
		const startDate = new Date(referenceStart);
		startDate.setDate(startDate.getDate() + periodNumber * 14);

		// Calculate end of current period (14 days later)
		const endDate = new Date(startDate);
		endDate.setDate(endDate.getDate() + 14);
		endDate.setUTCHours(4, 59, 59, 999); // 12:59 AM EST (23:59 UTC previous day)

		return {
			start_at: startDate.toISOString().split("T")[0],
			end_at: endDate.toISOString().split("T")[0],
			startDate,
			endDate,
		};
	}

	// Fallback (shouldn't happen)
	return {
		start_at: new Date().toISOString().split("T")[0],
		end_at: new Date().toISOString().split("T")[0],
		startDate: new Date(),
		endDate: new Date(),
	};
};

const processApiData = (data: any): LeaderboardPlayer[] => {
	if (!data?.affiliates || !Array.isArray(data.affiliates)) {
		console.error("Invalid API response structure - missing affiliates array");
		return [];
	}

	return data.affiliates
		.filter((item: any) => item && item.username)
		.map((item: any, index: number) => ({
			rank: index + 1,
			username: item.username,
			wager: parseFloat(item.wagered_amount) || 0,
			isFeatured: item.username.toLowerCase().includes("5moking"),
		}))
		.sort((a, b) => b.wager - a.wager)
		.map((player, idx) => ({ ...player, rank: idx + 1 }));
};

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
	monthlyLeaderboard: [],
	period: "biweekly",
	isLoading: false,
	error: null,
	periodInfo: null,
	setPeriod: (period) => set({ period }),
	fetchLeaderboard: async () => {
		set({ isLoading: true, error: null });
		try {
			const periodInfo = getDateRange("biweekly");
			const { start_at, end_at } = periodInfo;
			
			set({ periodInfo });

			const response = await fetch(
				`${API_URL}?start_at=${start_at}&end_at=${end_at}`
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => null);
				throw new Error(
					errorData?.message ||
						errorData?.error ||
						`API request failed with status ${response.status}`
				);
			}

			const data = await response.json();
			const processedData = processApiData(data);

			set({ monthlyLeaderboard: processedData });
		} catch (error) {
			set({
				error: error instanceof Error ? error.message : "Unknown error",
			});
		} finally {
			set({ isLoading: false });
		}
	},
}));
