import { create } from "zustand";
import api from "@/lib/api";
import { useAuthStore } from "./useAuthStore";

export type GiveawayStatus = "active" | "completed" | "upcoming";

export interface Giveaway {
	_id: string;
	title: string;
	endTime: string;
	participants: any[];
	totalParticipants: number;
	totalEntries: number;
	status: GiveawayStatus;
	winner?: any;
	isEntered: boolean;
}

interface GiveawayState {
	giveaways: Giveaway[];
	fetchGiveaways: () => Promise<void>;
	enterGiveaway: (id: string, toast: any) => Promise<void>;
	createGiveaway: (title: string, endTime: string, toast: any) => Promise<void>;
	drawWinner: (id: string, toast: any) => Promise<void>;
}

export const useGiveawayStore = create<GiveawayState>((set, get) => ({
	giveaways: [],

	fetchGiveaways: async () => {
		const token = useAuthStore.getState().token;
		try {
			const res = await api.get("/api/gws", {
				headers: { Authorization: `Bearer ${token}` },
			});
			const userId = useAuthStore.getState().user?.id;
			const enriched = res.data.map((gws: any) => ({
				...gws,
				isEntered: gws.participants.some(
					(p: any) => p._id === userId || p === userId
				),
				status: gws.state === "complete" ? "completed" : gws.state,
			}));
			set({ giveaways: enriched });
		} catch (err) {
			console.error("Failed to fetch giveaways", err);
		}
	},

	enterGiveaway: async (id, toast) => {
		const token = useAuthStore.getState().token;
		try {
			await api.post(
				`/api/gws/${id}/join`,
				{},
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			await get().fetchGiveaways();
			toast({ title: "Entered successfully" });
		} catch {
			toast({
				title: "Error",
				description: "You Should Wager to enter GW",
				variant: "destructive",
			});
		}
	},

	createGiveaway: async (title, endTime, toast) => {
		const token = useAuthStore.getState().token;
		try {
			await api.post(
				"/api/gws",
				{ title, endTime },
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			await get().fetchGiveaways();
			toast({ title: "Giveaway created successfully" });
		} catch {
			toast({
				title: "Error",
				description: "Failed to create giveaway",
				variant: "destructive",
			});
		}
	},

	drawWinner: async (id, toast) => {
		const token = useAuthStore.getState().token;
		try {
			await api.post(
				`/api/gws/${id}/draw`,
				{},
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			await get().fetchGiveaways();
			toast({ title: "Winner drawn successfully" });
		} catch {
			toast({
				title: "Error",
				description: "Failed to draw winner",
				variant: "destructive",
			});
		}
	},
}));
