import { create } from "zustand";

/**
 * View mode - what type of items to display
 */
export type ViewMode = "resorts" | "clinics" | "hospitals";

/**
 * Selection state for current view and selected items
 */
interface SelectionState {
  /** Current view mode */
  mode: ViewMode;
  /** Currently selected item ID (for details panel) */
  selectedId: string | null;
  /** Currently expanded item ID (for card accordion) */
  expandedId: string | null;
  /** Whether to show all related items in expanded view */
  showAllExpanded: boolean;

  // Actions
  setMode: (mode: ViewMode) => void;
  select: (id: string | null) => void;
  expand: (id: string | null) => void;
  toggleExpand: (id: string) => void;
  setShowAllExpanded: (show: boolean) => void;
  clearSelection: () => void;
}

export const useSelectionStore = create<SelectionState>()((set) => ({
  mode: "resorts",
  selectedId: null,
  expandedId: null,
  showAllExpanded: false,

  setMode: (mode) =>
    set({
      mode,
      selectedId: null,
      expandedId: null,
      showAllExpanded: false,
    }),

  select: (selectedId) => set({ selectedId }),

  expand: (expandedId) =>
    set({
      expandedId,
      showAllExpanded: false,
    }),

  toggleExpand: (id) =>
    set((state) => ({
      expandedId: state.expandedId === id ? null : id,
      showAllExpanded: false,
    })),

  setShowAllExpanded: (showAllExpanded) => set({ showAllExpanded }),

  clearSelection: () =>
    set({
      selectedId: null,
      expandedId: null,
      showAllExpanded: false,
    }),
}));

