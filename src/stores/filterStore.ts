import { create } from "zustand";
import type { PassNetwork } from "@/types";

/**
 * Care types that can be filtered
 */
export type CareType = "dialysis" | "hospital";

/**
 * Filter state for search and filtering
 */
interface FilterState {
  /** Search query text */
  searchQuery: string;
  /** Selected state filter (null = all states) */
  selectedState: string | null;
  /** Maximum distance in miles */
  maxDistance: number;
  /** Active pass networks filter */
  passNetworks: Set<PassNetwork>;
  /** Active care types filter */
  careTypes: Set<CareType>;

  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedState: (state: string | null) => void;
  setMaxDistance: (distance: number) => void;
  togglePassNetwork: (pass: PassNetwork) => void;
  toggleCareType: (type: CareType) => void;
  setPassNetworks: (passes: PassNetwork[]) => void;
  setCareTypes: (types: CareType[]) => void;
  reset: () => void;
}

const DEFAULT_FILTERS = {
  searchQuery: "",
  selectedState: null,
  maxDistance: 100,
  passNetworks: new Set<PassNetwork>(["epic", "ikon"]),
  careTypes: new Set<CareType>(["dialysis", "hospital"]),
};

export const useFilterStore = create<FilterState>()((set) => ({
  ...DEFAULT_FILTERS,

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setSelectedState: (selectedState) => set({ selectedState }),

  setMaxDistance: (maxDistance) => set({ maxDistance }),

  togglePassNetwork: (pass) =>
    set((state) => {
      const newSet = new Set(state.passNetworks);
      if (newSet.has(pass)) {
        // Don't allow deselecting if it's the last one
        if (newSet.size > 1) {
          newSet.delete(pass);
        }
      } else {
        newSet.add(pass);
      }
      return { passNetworks: newSet };
    }),

  toggleCareType: (type) =>
    set((state) => {
      const newSet = new Set(state.careTypes);
      if (newSet.has(type)) {
        // Don't allow deselecting if it's the last one
        if (newSet.size > 1) {
          newSet.delete(type);
        }
      } else {
        newSet.add(type);
      }
      return { careTypes: newSet };
    }),

  setPassNetworks: (passes) => set({ passNetworks: new Set(passes) }),

  setCareTypes: (types) => set({ careTypes: new Set(types) }),

  reset: () =>
    set({
      ...DEFAULT_FILTERS,
      // Create new Set instances to avoid reference issues
      passNetworks: new Set(DEFAULT_FILTERS.passNetworks),
      careTypes: new Set(DEFAULT_FILTERS.careTypes),
    }),
}));

