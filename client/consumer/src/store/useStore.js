import { create } from "zustand";

export const useStore = create((set) => ({
  queue: null,
  setQueue: (q) => set({ queue: q }),
}));