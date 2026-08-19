import { create } from "zustand";

const WIDTH_KEY = "clark-sidebar-width";
const MIN_WIDTH = 160;
const MAX_WIDTH = 420;
const DEFAULT_WIDTH = 260;

function readWidth(): number {
  try {
    const v = Number(localStorage.getItem(WIDTH_KEY));
    if (Number.isFinite(v) && v >= MIN_WIDTH && v <= MAX_WIDTH) return v;
  } catch {
    // ignore
  }
  return DEFAULT_WIDTH;
}

interface SidebarState {
  collapsed: boolean;
  width: number;
  toggleCollapsed: () => void;
  setWidth: (w: number) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  collapsed: false,
  width: readWidth(),
  toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
  setWidth: (width) => {
    const clamped = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width));
    try {
      localStorage.setItem(WIDTH_KEY, String(clamped));
    } catch {
      // ignore
    }
    set({ width: clamped });
  },
}));