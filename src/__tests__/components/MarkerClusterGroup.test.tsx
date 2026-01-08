/**
 * Tests for MarkerClusterGroup components
 *
 * Note: Full integration testing of Leaflet components requires a real browser environment.
 * These tests focus on verifying the component renders without errors and the basic structure.
 * E2E tests should be used for full map interaction testing.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { MapContainer } from "react-leaflet";
import {
  ResortClusterGroup,
  ClinicClusterGroup,
  HospitalClusterGroup,
  UrgentCareClusterGroup,
} from "@/components/map/MarkerClusterGroup";
import { mockResorts } from "../fixtures/resorts";
import { mockClinics } from "../fixtures/clinics";
import { mockHospitals } from "../fixtures/hospitals";
import type { Facility } from "@/types";

// Mock Leaflet's markercluster - add the markerClusterGroup function to L
// This needs to be done before the component imports
vi.mock("leaflet.markercluster", () => {
  // Side effect: add markerClusterGroup to L if not present
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const leaflet = require("leaflet");
  if (!leaflet.markerClusterGroup) {
    Object.defineProperty(leaflet, "markerClusterGroup", {
      value: () => leaflet.featureGroup(),
      writable: false,
      configurable: false,
    });
  }
  return {};
});

// Mock settings store
vi.mock("@/stores/settingsStore", () => ({
  useSettingsStore: () => ({
    distanceUnit: "mi",
    darkMode: "dark",
    colorTheme: "rose",
  }),
}));

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <MapContainer
      center={[39.8283, -98.5795]}
      zoom={4}
      style={{ height: "400px", width: "100%" }}
    >
      {children}
    </MapContainer>
  );
}

// Mock urgent care data
const mockUrgentCare: Facility[] = [
  {
    id: "uc-1",
    name: "Mountain Urgent Care",
    city: "Vail",
    state: "CO",
    zip: "81657",
    lat: 39.6403,
    lon: -106.3742,
    nearestResort: "Vail",
  },
  {
    id: "uc-2",
    name: "Summit Urgent Care",
    city: "Breckenridge",
    state: "CO",
    zip: "80424",
    lat: 39.4817,
    lon: -106.0384,
    nearestResort: "Breckenridge",
  },
];

describe("MarkerClusterGroup Components", () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    cleanup();
    mockOnSelect.mockClear();
  });

  describe("ResortClusterGroup", () => {
    it("renders without crashing", () => {
      expect(() =>
        render(
          <TestWrapper>
            <ResortClusterGroup
              resorts={mockResorts}
              selectedId={null}
              userLocation={null}
              onSelect={mockOnSelect}
            />
          </TestWrapper>
        )
      ).not.toThrow();
    });

    it("handles empty resorts array", () => {
      expect(() =>
        render(
          <TestWrapper>
            <ResortClusterGroup
              resorts={[]}
              selectedId={null}
              userLocation={null}
              onSelect={mockOnSelect}
            />
          </TestWrapper>
        )
      ).not.toThrow();
    });

    it("handles selected resort", () => {
      expect(() =>
        render(
          <TestWrapper>
            <ResortClusterGroup
              resorts={mockResorts}
              selectedId="Vail|CO"
              userLocation={null}
              onSelect={mockOnSelect}
            />
          </TestWrapper>
        )
      ).not.toThrow();
    });

    it("handles user location", () => {
      expect(() =>
        render(
          <TestWrapper>
            <ResortClusterGroup
              resorts={mockResorts}
              selectedId={null}
              userLocation={{ lat: 39.7392, lon: -104.9903, label: "Denver" }}
              onSelect={mockOnSelect}
            />
          </TestWrapper>
        )
      ).not.toThrow();
    });
  });

  describe("ClinicClusterGroup", () => {
    it("renders without crashing", () => {
      expect(() =>
        render(
          <TestWrapper>
            <ClinicClusterGroup
              clinics={mockClinics}
              selectedId={null}
              userLocation={null}
              onSelect={mockOnSelect}
            />
          </TestWrapper>
        )
      ).not.toThrow();
    });

    it("handles empty clinics array", () => {
      expect(() =>
        render(
          <TestWrapper>
            <ClinicClusterGroup
              clinics={[]}
              selectedId={null}
              userLocation={null}
              onSelect={mockOnSelect}
            />
          </TestWrapper>
        )
      ).not.toThrow();
    });

    it("handles selected clinic", () => {
      expect(() =>
        render(
          <TestWrapper>
            <ClinicClusterGroup
              clinics={mockClinics}
              selectedId={mockClinics[0]?.ccn || null}
              userLocation={null}
              onSelect={mockOnSelect}
            />
          </TestWrapper>
        )
      ).not.toThrow();
    });
  });

  describe("HospitalClusterGroup", () => {
    it("renders without crashing", () => {
      expect(() =>
        render(
          <TestWrapper>
            <HospitalClusterGroup
              hospitals={mockHospitals}
              selectedId={null}
              userLocation={null}
              onSelect={mockOnSelect}
            />
          </TestWrapper>
        )
      ).not.toThrow();
    });

    it("handles empty hospitals array", () => {
      expect(() =>
        render(
          <TestWrapper>
            <HospitalClusterGroup
              hospitals={[]}
              selectedId={null}
              userLocation={null}
              onSelect={mockOnSelect}
            />
          </TestWrapper>
        )
      ).not.toThrow();
    });

    it("handles selected hospital", () => {
      expect(() =>
        render(
          <TestWrapper>
            <HospitalClusterGroup
              hospitals={mockHospitals}
              selectedId={mockHospitals[0]?.id || null}
              userLocation={null}
              onSelect={mockOnSelect}
            />
          </TestWrapper>
        )
      ).not.toThrow();
    });
  });

  describe("UrgentCareClusterGroup", () => {
    it("renders without crashing", () => {
      expect(() =>
        render(
          <TestWrapper>
            <UrgentCareClusterGroup
              urgentCare={mockUrgentCare}
              selectedId={null}
              userLocation={null}
              onSelect={mockOnSelect}
            />
          </TestWrapper>
        )
      ).not.toThrow();
    });

    it("handles empty urgentCare array", () => {
      expect(() =>
        render(
          <TestWrapper>
            <UrgentCareClusterGroup
              urgentCare={[]}
              selectedId={null}
              userLocation={null}
              onSelect={mockOnSelect}
            />
          </TestWrapper>
        )
      ).not.toThrow();
    });

    it("handles selected urgent care", () => {
      expect(() =>
        render(
          <TestWrapper>
            <UrgentCareClusterGroup
              urgentCare={mockUrgentCare}
              selectedId="uc-1"
              userLocation={null}
              onSelect={mockOnSelect}
            />
          </TestWrapper>
        )
      ).not.toThrow();
    });
  });
});
