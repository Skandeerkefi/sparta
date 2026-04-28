import { create } from "zustand";

type StreamStatus = "online" | "offline";

interface StreamState {
  streamStatus: StreamStatus;
  viewerCount: number;
  setStreamStatus: (status: StreamStatus) => void;
  setViewerCount: (count: number) => void;
}

export const useStreamStore = create<StreamState>((set) => ({
  streamStatus: "offline",
  viewerCount: 0,
  setStreamStatus: (status) => set({ streamStatus: status }),
  setViewerCount: (count) => set({ viewerCount: count }),
}));