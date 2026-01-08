import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UrgentCareCard } from "@/components/cards/UrgentCareCard";
import { useSelectionStore } from "@/stores/selectionStore";
import { useSettingsStore } from "@/stores/settingsStore";
import type { Facility, ResortWithDistance } from "@/types";

// Mock analytics
vi.mock("@/utils/analytics", () => ({
  trackItemSelect: vi.fn(),
  trackReportOpen: vi.fn(),
  trackReportSubmit: vi.fn(),
}));

const mockFacility: Facility = {
  id: "osm-123",
  name: "Mountain Urgent Care",
  type: "urgent_care",
  address: "123 Main St",
  city: "Vail",
  state: "CO",
  zip: "81657",
  lat: 39.6403,
  lon: -106.3742,
  phone: "(970) 555-1234",
  website: "https://example.com",
  lastVerified: "2026-01-01",
  sourceUrl: "https://openstreetmap.org/node/123",
  nearestResort: "Vail",
  nearestResortDist: 2.5,
};

const mockNearestResorts: ResortWithDistance[] = [
  { id: "vail", name: "Vail", state: "CO", lat: 39.6, lon: -106.3, distance: 2.5, region: "rockies" },
  { id: "beaver-creek", name: "Beaver Creek", state: "CO", lat: 39.6, lon: -106.5, distance: 8.1, region: "rockies" },
];

describe("UrgentCareCard", () => {
  beforeEach(() => {
    useSelectionStore.getState().clearSelection();
    useSettingsStore.getState().resetToDefaults();

    // Create portal root if it doesn't exist
    if (!document.getElementById("portal-root")) {
      const portalRoot = document.createElement("div");
      portalRoot.id = "portal-root";
      document.body.appendChild(portalRoot);
    }
  });

  describe("basic rendering", () => {
    it("renders facility name with emoji", () => {
      render(<UrgentCareCard facility={mockFacility} />);

      expect(screen.getByText(/Mountain Urgent Care/)).toBeInTheDocument();
      expect(screen.getByText(/🩹/)).toBeInTheDocument();
    });

    it("renders Urgent Care badge", () => {
      render(<UrgentCareCard facility={mockFacility} />);

      expect(screen.getByText("Urgent Care")).toBeInTheDocument();
    });

    it("renders state badge", () => {
      render(<UrgentCareCard facility={mockFacility} />);

      expect(screen.getByText("CO")).toBeInTheDocument();
    });

    it("renders city location", () => {
      render(<UrgentCareCard facility={mockFacility} />);

      expect(screen.getByText(/Vail, CO/)).toBeInTheDocument();
    });

    it("renders nearest resort distance badge", () => {
      render(<UrgentCareCard facility={mockFacility} />);

      expect(screen.getByText(/🏔️ 2\.5 mi/)).toBeInTheDocument();
    });

    it("renders user distance when provided", () => {
      render(<UrgentCareCard facility={mockFacility} userDistance={5.3} />);

      expect(screen.getByText(/5.3 mi away/)).toBeInTheDocument();
    });
  });

  describe("24/7 indicator", () => {
    it("shows 24/7 badge when open24Hours is true", () => {
      const facility24h = { ...mockFacility, open24Hours: true };
      render(<UrgentCareCard facility={facility24h} />);

      expect(screen.getByText("24/7")).toBeInTheDocument();
    });

    it("does not show 24/7 badge when open24Hours is false", () => {
      render(<UrgentCareCard facility={mockFacility} />);

      expect(screen.queryByText("24/7")).not.toBeInTheDocument();
    });
  });

  describe("expansion behavior", () => {
    it("expands when clicked", () => {
      render(<UrgentCareCard facility={mockFacility} />);

      fireEvent.click(screen.getByText(/Mountain Urgent Care/));

      // Should show expanded content (address, phone, etc.)
      expect(screen.getByText(/123 Main St/)).toBeInTheDocument();
    });

    it("shows phone link when expanded", () => {
      render(<UrgentCareCard facility={mockFacility} />);

      fireEvent.click(screen.getByText(/Mountain Urgent Care/));

      const phoneLink = screen.getByText("(970) 555-1234");
      expect(phoneLink).toBeInTheDocument();
      expect(phoneLink.closest("a")).toHaveAttribute("href", "tel:9705551234");
    });

    it("shows website link when expanded", () => {
      render(<UrgentCareCard facility={mockFacility} />);

      fireEvent.click(screen.getByText(/Mountain Urgent Care/));

      const websiteLink = screen.getByText("Website");
      expect(websiteLink).toBeInTheDocument();
      expect(websiteLink.closest("a")).toHaveAttribute("href", "https://example.com");
    });

    it("shows verification info when expanded", () => {
      render(<UrgentCareCard facility={mockFacility} />);

      fireEvent.click(screen.getByText(/Mountain Urgent Care/));

      expect(screen.getByText(/Last verified: 2026-01-01/)).toBeInTheDocument();
      expect(screen.getByText("Source")).toBeInTheDocument();
    });

    it("collapses when clicked again", () => {
      render(<UrgentCareCard facility={mockFacility} />);

      // Expand
      fireEvent.click(screen.getByText(/Mountain Urgent Care/));
      expect(screen.getByText(/123 Main St/)).toBeInTheDocument();

      // Collapse
      fireEvent.click(screen.getByText(/Mountain Urgent Care/));
      expect(screen.queryByText(/123 Main St/)).not.toBeInTheDocument();
    });
  });

  describe("nearest resorts", () => {
    it("shows nearest resorts when expanded and provided", () => {
      render(
        <UrgentCareCard
          facility={mockFacility}
          nearestResorts={mockNearestResorts}
        />
      );

      fireEvent.click(screen.getByText(/Mountain Urgent Care/));

      expect(screen.getByText("Nearest Resorts:")).toBeInTheDocument();
      expect(screen.getByText(/1\. Vail/)).toBeInTheDocument();
      expect(screen.getByText(/2\. Beaver Creek/)).toBeInTheDocument();
    });

    it("limits shown resorts to 5", () => {
      const manyResorts: ResortWithDistance[] = Array.from({ length: 10 }, (_, i) => ({
        id: `resort-${i}`,
        name: `Resort ${i}`,
        state: "CO",
        lat: 39.6,
        lon: -106.3,
        distance: i * 5,
        region: "rockies" as const,
      }));

      render(
        <UrgentCareCard facility={mockFacility} nearestResorts={manyResorts} />
      );

      fireEvent.click(screen.getByText(/Mountain Urgent Care/));

      // Should show first 5
      expect(screen.getByText(/1\. Resort 0/)).toBeInTheDocument();
      expect(screen.getByText(/5\. Resort 4/)).toBeInTheDocument();
      // Should NOT show 6th
      expect(screen.queryByText(/6\. Resort 5/)).not.toBeInTheDocument();
    });
  });

  describe("report functionality", () => {
    it("shows report link when expanded", () => {
      render(<UrgentCareCard facility={mockFacility} />);

      fireEvent.click(screen.getByText(/Mountain Urgent Care/));

      expect(screen.getByText("Report an issue")).toBeInTheDocument();
    });

    it("opens report form when report link is clicked", () => {
      render(<UrgentCareCard facility={mockFacility} />);

      fireEvent.click(screen.getByText(/Mountain Urgent Care/));
      fireEvent.click(screen.getByText("Report an issue"));

      expect(screen.getByText("Report an Issue")).toBeInTheDocument();
    });
  });

  describe("distance unit conversion", () => {
    it("shows distance in kilometers when setting is kilometers", () => {
      useSettingsStore.getState().setDistanceUnit("km");

      render(<UrgentCareCard facility={mockFacility} userDistance={5} />);

      // 5 miles = 8.05 km
      expect(screen.getByText(/8\.0\d? km away/)).toBeInTheDocument();
    });
  });

  describe("data-testid", () => {
    it("has correct data attribute for scrolling", () => {
      render(<UrgentCareCard facility={mockFacility} />);

      const card = screen.getByText(/Mountain Urgent Care/).closest("[data-urgent-care-id]");
      expect(card).toHaveAttribute("data-urgent-care-id", "osm-123");
    });
  });
});
