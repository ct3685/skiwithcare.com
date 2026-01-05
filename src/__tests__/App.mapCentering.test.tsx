/**
 * Integration tests for map centering behavior
 *
 * These tests verify that the map only flies to selected items
 * when the selection actually changes, not on every re-render.
 * This prevents the "focus hijacking" bug where the map would
 * snap back to the selected item during normal interactions.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, act, waitFor } from "@testing-library/react";
import { useSelectionStore } from "@/stores/selectionStore";
import { mockResorts } from "./fixtures";

// Track map method calls
const mockFlyTo = vi.fn();
const mockFitBounds = vi.fn();
const mockGetCenter = vi.fn(() => ({ lat: 39.8283, lng: -98.5795 }));
const mockAddLayer = vi.fn();
const mockRemoveLayer = vi.fn();

// Create a mock map instance
const mockMapInstance = {
  flyTo: mockFlyTo,
  fitBounds: mockFitBounds,
  getCenter: mockGetCenter,
  addLayer: mockAddLayer,
  removeLayer: mockRemoveLayer,
};

// Mock Leaflet
vi.mock("leaflet", async () => {
  const actual = await vi.importActual("leaflet");
  return {
    ...actual,
    latLngBounds: vi.fn(() => ({
      extend: vi.fn(),
    })),
    tileLayer: vi.fn(() => ({
      addTo: vi.fn(() => ({ remove: vi.fn() })),
    })),
  };
});

// Mock react-leaflet components
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  useMap: () => mockMapInstance,
  useMapEvents: () => mockMapInstance,
  Marker: () => null,
  Popup: () => null,
  Polyline: () => null,
}));

// Mock the data hook
vi.mock("@/hooks", () => ({
  useData: () => ({
    resorts: mockResorts,
    clinics: [],
    hospitals: [],
    isLoading: false,
    error: null,
  }),
  useFilteredData: () => ({
    resorts: mockResorts,
    clinics: [],
    hospitals: [],
    sortOrigin: "map",
  }),
}));

// Mock analytics
vi.mock("@/utils/analytics", () => ({
  trackItemSelect: vi.fn(),
  trackThemeChange: vi.fn(),
}));

// Import App after mocks are set up
import App from "@/App";

describe("Map Centering Behavior", () => {
  beforeEach(() => {
    // Reset all mocks
    mockFlyTo.mockClear();
    mockFitBounds.mockClear();
    mockGetCenter.mockClear();
    mockAddLayer.mockClear();
    mockRemoveLayer.mockClear();

    // Reset stores
    useSelectionStore.getState().clearSelection();
    localStorage.clear();

    // Create portal root
    if (!document.getElementById("portal-root")) {
      const portalRoot = document.createElement("div");
      portalRoot.id = "portal-root";
      document.body.appendChild(portalRoot);
    }
  });

  describe("initial selection", () => {
    it("flies to item when first selected", async () => {
      render(<App />);

      // Select a resort
      act(() => {
        useSelectionStore.getState().toggleExpand("Vail|CO");
      });

      // Wait for the effect to run
      await waitFor(() => {
        // Should call fitBounds (since there are related items computed)
        // or flyTo if no related items
        const totalCalls =
          mockFlyTo.mock.calls.length + mockFitBounds.mock.calls.length;
        expect(totalCalls).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe("re-render with same selection", () => {
    it("does NOT re-center when component re-renders with same expandedId", async () => {
      const { rerender } = render(<App />);

      // Select a resort
      act(() => {
        useSelectionStore.getState().toggleExpand("Vail|CO");
      });

      // Wait for initial centering
      await waitFor(() => {
        const totalCalls =
          mockFlyTo.mock.calls.length + mockFitBounds.mock.calls.length;
        expect(totalCalls).toBeGreaterThanOrEqual(1);
      });

      // Record the call count after initial selection
      const callsAfterSelection =
        mockFlyTo.mock.calls.length + mockFitBounds.mock.calls.length;

      // Force a re-render (simulates what happens during normal interactions)
      rerender(<App />);

      // Wait a tick for any effects to run
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      // Call count should NOT have increased
      const callsAfterRerender =
        mockFlyTo.mock.calls.length + mockFitBounds.mock.calls.length;

      expect(callsAfterRerender).toBe(callsAfterSelection);
    });

    it("does NOT re-center on multiple re-renders", async () => {
      const { rerender } = render(<App />);

      // Select a resort
      act(() => {
        useSelectionStore.getState().toggleExpand("Vail|CO");
      });

      await waitFor(() => {
        const totalCalls =
          mockFlyTo.mock.calls.length + mockFitBounds.mock.calls.length;
        expect(totalCalls).toBeGreaterThanOrEqual(1);
      });

      const callsAfterSelection =
        mockFlyTo.mock.calls.length + mockFitBounds.mock.calls.length;

      // Multiple re-renders
      for (let i = 0; i < 5; i++) {
        rerender(<App />);
      }

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      const callsAfterRerenders =
        mockFlyTo.mock.calls.length + mockFitBounds.mock.calls.length;

      expect(callsAfterRerenders).toBe(callsAfterSelection);
    });
  });

  describe("selection changes", () => {
    it("flies to new item when selection changes", async () => {
      render(<App />);

      // Select first resort
      act(() => {
        useSelectionStore.getState().toggleExpand("Vail|CO");
      });

      await waitFor(() => {
        const totalCalls =
          mockFlyTo.mock.calls.length + mockFitBounds.mock.calls.length;
        expect(totalCalls).toBeGreaterThanOrEqual(1);
      });

      const callsAfterFirstSelection =
        mockFlyTo.mock.calls.length + mockFitBounds.mock.calls.length;

      // Select different resort
      act(() => {
        useSelectionStore.getState().toggleExpand("Breckenridge|CO");
      });

      await waitFor(() => {
        const totalCalls =
          mockFlyTo.mock.calls.length + mockFitBounds.mock.calls.length;
        expect(totalCalls).toBeGreaterThan(callsAfterFirstSelection);
      });
    });

    it("does NOT fly when deselecting (expandedId becomes null)", async () => {
      render(<App />);

      // Select a resort
      act(() => {
        useSelectionStore.getState().toggleExpand("Vail|CO");
      });

      await waitFor(() => {
        const totalCalls =
          mockFlyTo.mock.calls.length + mockFitBounds.mock.calls.length;
        expect(totalCalls).toBeGreaterThanOrEqual(1);
      });

      const callsAfterSelection =
        mockFlyTo.mock.calls.length + mockFitBounds.mock.calls.length;

      // Deselect (toggle same item)
      act(() => {
        useSelectionStore.getState().toggleExpand("Vail|CO");
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      // Should NOT have called flyTo/fitBounds again
      const callsAfterDeselection =
        mockFlyTo.mock.calls.length + mockFitBounds.mock.calls.length;

      expect(callsAfterDeselection).toBe(callsAfterSelection);
    });
  });

  describe("rapid selection changes", () => {
    it("handles rapid selection changes correctly", async () => {
      render(<App />);

      // Rapidly select multiple items
      act(() => {
        useSelectionStore.getState().toggleExpand("Vail|CO");
      });

      act(() => {
        useSelectionStore.getState().toggleExpand("Breckenridge|CO");
      });

      act(() => {
        useSelectionStore.getState().toggleExpand("Park City|UT");
      });

      await waitFor(() => {
        // Should have called centering methods at least 3 times (once per selection)
        const totalCalls =
          mockFlyTo.mock.calls.length + mockFitBounds.mock.calls.length;
        expect(totalCalls).toBeGreaterThanOrEqual(3);
      });
    });
  });
});
