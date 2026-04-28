import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";

export type SlotCallStatus = "pending" | "accepted" | "rejected" | "played";

export interface SlotCall {
	id: string;
	slotName: string;
	requester: string;
	timestamp: string;
	status: SlotCallStatus;
	x250Hit?: boolean;
	bonusCall?: { name: string; createdAt: string };
}

interface SlotCallState {
	slotCalls: SlotCall[];
	isSubmitting: boolean;
	addSlotCall: (
		slotName: string
	) => Promise<{ success: boolean; error?: string }>;
	submitBonusCall: (
		id: string,
		slotName: string
	) => Promise<{ success: boolean; error?: string }>;
	updateSlotStatus: (
		id: string,
		status: SlotCallStatus,
		x250Hit?: boolean
	) => Promise<{ success: boolean; error?: string }>;
	deleteSlotCall: (id: string) => Promise<{ success: boolean; error?: string }>;
	fetchSlotCalls: () => Promise<void>;
}

export const useSlotCallStore = create<SlotCallState>((set, get) => ({
	slotCalls: [],
	isSubmitting: false,

	addSlotCall: async (slotName) => {
		const token = useAuthStore.getState().token;
		if (!token) return { success: false, error: "Not authenticated" };

		set({ isSubmitting: true });
		try {
			const res = await fetch(
				"https://bswrxstidata-production.up.railway.app/api/slot-calls",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ name: slotName }),
					credentials: "include",
				}
			);

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.message || "Failed to add slot call");
			}

			const response = await res.json();
			const newCall = response.slotCall;

			set((state) => ({
				slotCalls: [
					{
						id: newCall._id,
						slotName: newCall.name,
						requester: useAuthStore.getState().user?.kickUsername || "You",
						timestamp: new Date(newCall.createdAt).toLocaleString(),
						status: newCall.status,
						x250Hit: newCall.x250Hit,
						bonusCall: newCall.bonusCall,
					},
					...state.slotCalls,
				],
				isSubmitting: false,
			}));

			return { success: true };
		} catch (error: any) {
			set({ isSubmitting: false });
			return { success: false, error: error.message };
		}
	},

	submitBonusCall: async (id, slotName) => {
		const token = useAuthStore.getState().token;
		if (!token) return { success: false, error: "Not authenticated" };

		try {
			const res = await fetch(
				`https://bswrxstidata-production.up.railway.app/api/slot-calls/${id}/bonus-call`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ name: slotName }),
					credentials: "include",
				}
			);

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.message || "Failed to submit bonus call");
			}

			const updated = (await res.json()).slotCall;
			set((state) => ({
				slotCalls: state.slotCalls.map((call) =>
					call.id === id ? { ...call, bonusCall: updated.bonusCall } : call
				),
			}));
			return { success: true };
		} catch (error: any) {
			return { success: false, error: error.message };
		}
	},

	updateSlotStatus: async (id, status, x250Hit = false) => {
		const token = useAuthStore.getState().token;
		if (!token) return { success: false, error: "Not authenticated" };

		try {
			const res = await fetch(
				`https://bswrxstidata-production.up.railway.app/api/slot-calls/${id}/status`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ status, x250Hit }),
					credentials: "include",
				}
			);

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.message || "Failed to update slot call status");
			}

			const updated = (await res.json()).slotCall;

			set((state) => ({
				slotCalls: state.slotCalls.map((call) =>
					call.id === id
						? {
								...call,
								status: updated.status,
								x250Hit: updated.x250Hit,
						  }
						: call
				),
			}));
			return { success: true };
		} catch (error: any) {
			return { success: false, error: error.message };
		}
	},

	deleteSlotCall: async (id) => {
		const token = useAuthStore.getState().token;
		if (!token) return { success: false, error: "Not authenticated" };

		try {
			const res = await fetch(
				`https://bswrxstidata-production.up.railway.app/api/slot-calls/${id}`,
				{
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${token}`,
					},
					credentials: "include",
				}
			);

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.message || "Failed to delete slot call");
			}

			// Refresh list after deletion
			await get().fetchSlotCalls();

			return { success: true };
		} catch (error: any) {
			return { success: false, error: error.message };
		}
	},

	fetchSlotCalls: async () => {
		const token = useAuthStore.getState().token;
		const userRole = useAuthStore.getState().user?.role;
		if (!token) return;

		const url =
			userRole === "admin"
				? "https://bswrxstidata-production.up.railway.app/api/slot-calls"
				: "https://bswrxstidata-production.up.railway.app/api/slot-calls/my";

		try {
			const res = await fetch(url, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
				credentials: "include",
			});

			if (!res.ok) throw new Error("Failed to fetch slot calls");

			const data = await res.json();

			const mapped = data.map((item: any) => ({
				id: item._id,
				slotName: item.name,
				requester:
					item.user?.kickUsername ||
					useAuthStore.getState().user?.kickUsername ||
					"You",
				timestamp: new Date(item.createdAt).toLocaleString(),
				status: item.status,
				x250Hit: item.x250Hit,
				bonusCall: item.bonusCall,
			}));

			set({ slotCalls: mapped });
		} catch (error) {
			console.error("Error fetching slot calls:", error);
		}
	},
}));
