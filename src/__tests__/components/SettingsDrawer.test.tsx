import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsDrawer } from "@/components/layout/SettingsDrawer";
import { useSettingsStore } from "@/stores/settingsStore";

// Mock the analytics
vi.mock("@/utils/analytics", () => ({
  trackThemeChange: vi.fn(),
}));

describe("SettingsDrawer", () => {
  beforeEach(() => {
    // Reset store to defaults
    useSettingsStore.getState().resetToDefaults();
    
    // Create portal root if it doesn't exist
    if (!document.getElementById("portal-root")) {
      const portalRoot = document.createElement("div");
      portalRoot.id = "portal-root";
      document.body.appendChild(portalRoot);
    }
  });

  describe("visibility", () => {
    it("renders drawer content when open", () => {
      // Open the drawer
      useSettingsStore.getState().openDrawer();
      
      render(<SettingsDrawer />);
      
      // Check that all main sections are visible
      expect(screen.getByText("Settings")).toBeInTheDocument();
      expect(screen.getByText("Appearance")).toBeInTheDocument();
      expect(screen.getByText("Theme")).toBeInTheDocument();
      expect(screen.getByText("Mode")).toBeInTheDocument();
      expect(screen.getByText("Units")).toBeInTheDocument();
      expect(screen.getByText("Distance")).toBeInTheDocument();
      expect(screen.getByText("Defaults")).toBeInTheDocument();
    });

    it("renders all theme buttons when open", () => {
      useSettingsStore.getState().openDrawer();
      
      render(<SettingsDrawer />);
      
      expect(screen.getByText("Rose")).toBeInTheDocument();
      expect(screen.getByText("Alpine")).toBeInTheDocument();
      expect(screen.getByText("Glacier")).toBeInTheDocument();
    });

    it("renders all mode buttons when open", () => {
      useSettingsStore.getState().openDrawer();
      
      render(<SettingsDrawer />);
      
      expect(screen.getByText(/Dark/)).toBeInTheDocument();
      expect(screen.getByText(/Light/)).toBeInTheDocument();
      expect(screen.getByText(/Auto/)).toBeInTheDocument();
    });

    it("renders distance unit buttons when open", () => {
      useSettingsStore.getState().openDrawer();
      
      render(<SettingsDrawer />);
      
      expect(screen.getByText("Miles")).toBeInTheDocument();
      expect(screen.getByText("Kilometers")).toBeInTheDocument();
    });

    it("renders reset button when open", () => {
      useSettingsStore.getState().openDrawer();
      
      render(<SettingsDrawer />);
      
      expect(screen.getByText("Reset to Defaults")).toBeInTheDocument();
    });

    it("content container has correct test id", () => {
      useSettingsStore.getState().openDrawer();
      
      render(<SettingsDrawer />);
      
      expect(screen.getByTestId("settings-content")).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("closes drawer when close button is clicked", () => {
      useSettingsStore.getState().openDrawer();
      expect(useSettingsStore.getState().isDrawerOpen).toBe(true);
      
      render(<SettingsDrawer />);
      
      const closeButton = screen.getByLabelText("Close settings");
      fireEvent.click(closeButton);
      
      expect(useSettingsStore.getState().isDrawerOpen).toBe(false);
    });

    it("closes drawer when backdrop is clicked", () => {
      useSettingsStore.getState().openDrawer();
      
      render(<SettingsDrawer />);
      
      // The backdrop is the first fixed element with onClick={closeDrawer}
      const backdrop = document.querySelector('[class*="bg-black/60"]');
      expect(backdrop).toBeInTheDocument();
      
      fireEvent.click(backdrop!);
      
      expect(useSettingsStore.getState().isDrawerOpen).toBe(false);
    });

    it("changes color theme when theme button is clicked", () => {
      useSettingsStore.getState().openDrawer();
      expect(useSettingsStore.getState().colorTheme).toBe("rose");
      
      render(<SettingsDrawer />);
      
      const alpineButton = screen.getByText("Alpine");
      fireEvent.click(alpineButton);
      
      expect(useSettingsStore.getState().colorTheme).toBe("alpine");
    });

    it("changes dark mode when mode button is clicked", () => {
      useSettingsStore.getState().openDrawer();
      expect(useSettingsStore.getState().darkMode).toBe("dark");
      
      render(<SettingsDrawer />);
      
      const lightButton = screen.getByText(/Light/);
      fireEvent.click(lightButton);
      
      expect(useSettingsStore.getState().darkMode).toBe("light");
    });

    it("changes distance unit when unit button is clicked", () => {
      useSettingsStore.getState().openDrawer();
      expect(useSettingsStore.getState().distanceUnit).toBe("miles");
      
      render(<SettingsDrawer />);
      
      const kmButton = screen.getByText("Kilometers");
      fireEvent.click(kmButton);
      
      expect(useSettingsStore.getState().distanceUnit).toBe("km");
    });

    it("resets to defaults when reset button is clicked", () => {
      // Change some settings
      useSettingsStore.getState().setColorTheme("glacier");
      useSettingsStore.getState().setDarkMode("light");
      useSettingsStore.getState().setDistanceUnit("km");
      useSettingsStore.getState().openDrawer();
      
      render(<SettingsDrawer />);
      
      const resetButton = screen.getByText("Reset to Defaults");
      fireEvent.click(resetButton);
      
      const state = useSettingsStore.getState();
      expect(state.colorTheme).toBe("rose");
      expect(state.darkMode).toBe("dark");
      expect(state.distanceUnit).toBe("miles");
    });
  });

  describe("keyboard navigation", () => {
    it("closes drawer on Escape key", () => {
      useSettingsStore.getState().openDrawer();
      
      render(<SettingsDrawer />);
      
      fireEvent.keyDown(document, { key: "Escape" });
      
      expect(useSettingsStore.getState().isDrawerOpen).toBe(false);
    });
  });

  describe("accessibility", () => {
    it("has accessible close button", () => {
      useSettingsStore.getState().openDrawer();
      
      render(<SettingsDrawer />);
      
      const closeButton = screen.getByLabelText("Close settings");
      expect(closeButton).toBeInTheDocument();
    });

    it("drawer has proper heading structure", () => {
      useSettingsStore.getState().openDrawer();
      
      render(<SettingsDrawer />);
      
      // Main heading
      const mainHeading = screen.getByRole("heading", { name: "Settings" });
      expect(mainHeading).toBeInTheDocument();
      
      // Section headings
      expect(screen.getByText("Appearance")).toBeInTheDocument();
      expect(screen.getByText("Units")).toBeInTheDocument();
      expect(screen.getByText("Defaults")).toBeInTheDocument();
    });
  });
});

