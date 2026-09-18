import { create } from "zustand";
import { DEFAULT_CENTER, type LatLng } from "./geo";
import type { CategoryId, StatusId } from "./categories";

type AppStore = {
  selectedReportId: string | null;
  createOpen: boolean;
  filtersOpen: boolean;
  fabOpen: boolean;
  pinPickMode: boolean;
  categories: CategoryId[];
  statuses: StatusId[];
  userLocation: LatLng | null;
  reportLocation: LatLng | null;
  mapCenter: LatLng;
  setSelectedReportId: (id: string | null) => void;
  setCreateOpen: (open: boolean) => void;
  setFiltersOpen: (open: boolean) => void;
  setFabOpen: (open: boolean) => void;
  setPinPickMode: (on: boolean) => void;
  toggleCategory: (id: CategoryId) => void;
  toggleStatus: (id: StatusId) => void;
  clearFilters: () => void;
  setUserLocation: (loc: LatLng | null) => void;
  setReportLocation: (loc: LatLng | null) => void;
  setMapCenter: (loc: LatLng) => void;
};

export const useAppStore = create<AppStore>((set) => ({
  selectedReportId: null,
  createOpen: false,
  filtersOpen: false,
  fabOpen: false,
  pinPickMode: false,
  categories: [],
  statuses: [],
  userLocation: null,
  reportLocation: null,
  mapCenter: DEFAULT_CENTER,
  setSelectedReportId: (id) => set({ selectedReportId: id, fabOpen: false }),
  setCreateOpen: (open) =>
    set((s) => ({
      createOpen: open,
      fabOpen: false,
      selectedReportId: open ? null : s.selectedReportId,
      pinPickMode: open,
    })),
  setFiltersOpen: (open) => set({ filtersOpen: open, fabOpen: false }),
  setFabOpen: (open) => set({ fabOpen: open }),
  setPinPickMode: (on) => set({ pinPickMode: on }),
  toggleCategory: (id) =>
    set((s) => ({
      categories: s.categories.includes(id)
        ? s.categories.filter((c) => c !== id)
        : [...s.categories, id],
    })),
  toggleStatus: (id) =>
    set((s) => ({
      statuses: s.statuses.includes(id)
        ? s.statuses.filter((x) => x !== id)
        : [...s.statuses, id],
    })),
  clearFilters: () => set({ categories: [], statuses: [] }),
  setUserLocation: (loc) => set({ userLocation: loc }),
  setReportLocation: (loc) => set({ reportLocation: loc }),
  setMapCenter: (loc) => set({ mapCenter: loc }),
}));
