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
  /** Index of highlighted connection line (-1 for none) */
  highlightedConnectionIndex: number;

  // Actions
  setMode: (mode: ViewMode) => void;
  select: (id: string | null) => void;
  expand: (id: string | null) => void;
  toggleExpand: (id: string) => void;
  setShowAllExpanded: (show: boolean) => void;
  setHighlightedConnection: (index: number) => void;
  clearSelection: () => void;
}

export const useSelectionStore = create<SelectionState>()((set) => ({
  mode: "resorts",
  selectedId: null,
  expandedId: null,
  showAllExpanded: false,
  highlightedConnectionIndex: -1,

  setMode: (mode) =>
    set({
      mode,
      selectedId: null,
      expandedId: null,
      showAllExpanded: false,
      highlightedConnectionIndex: -1,
    }),

  select: (selectedId) => set({ selectedId }),

  expand: (expandedId) =>
    set({
      expandedId,
      showAllExpanded: false,
      highlightedConnectionIndex: -1,
    }),

  toggleExpand: (id) =>
    set((state) => ({
      expandedId: state.expandedId === id ? null : id,
      showAllExpanded: false,
      highlightedConnectionIndex: -1,
    })),

  setShowAllExpanded: (showAllExpanded) => set({ showAllExpanded }),

  setHighlightedConnection: (highlightedConnectionIndex) =>
    set({ highlightedConnectionIndex }),

  clearSelection: () =>
    set({
      selectedId: null,
      expandedId: null,
      showAllExpanded: false,
      highlightedConnectionIndex: -1,
    }),
}));

