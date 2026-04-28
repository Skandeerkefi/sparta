// src/store/useBonusHuntStore.ts
import { create } from "zustand";

export interface BonusEntry {
	id: string;
	slotName: string;
	wager: number;
	spinCost: number;
	winning: number;
	multiplier: number;
}

interface BonusHuntState {
	entries: BonusEntry[];
	addEntry: (entry: Omit<BonusEntry, "id">) => void;
	removeEntry: (id: string) => void;
	clearEntries: () => void;
}

export const useBonusHuntStore = create<BonusHuntState>((set) => ({
	entries: [],
	addEntry: (entry) =>
		set((state) => ({
			entries: [...state.entries, { ...entry, id: crypto.randomUUID() }],
		})),
	removeEntry: (id) =>
		set((state) => ({
			entries: state.entries.filter((e) => e.id !== id),
		})),
	clearEntries: () => set({ entries: [] }),
}));
