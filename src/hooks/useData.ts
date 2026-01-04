import { useState, useEffect } from "react";
import type { Resort, Clinic, Hospital } from "@/types";

interface DataState {
  resorts: Resort[];
  clinics: Clinic[];
  hospitals: Hospital[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to load all data from JSON files
 */
export function useData(): DataState {
  const [state, setState] = useState<DataState>({
    resorts: [],
    clinics: [],
    hospitals: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    async function loadData() {
      try {
        // Load resorts and clinics in parallel
        const [resortsRes, clinicsRes] = await Promise.all([
          fetch("/resorts.json"),
          fetch("/clinics.json"),
        ]);

        if (!resortsRes.ok) {
          throw new Error("Failed to load resorts data");
        }
        if (!clinicsRes.ok) {
          throw new Error("Failed to load clinics data");
        }

        const resorts: Resort[] = await resortsRes.json();
        const clinics: Clinic[] = await clinicsRes.json();

        // Try to load hospitals (may not exist yet)
        let hospitals: Hospital[] = [];
        try {
          const hospitalsRes = await fetch("/hospitals.json");
          if (hospitalsRes.ok) {
            hospitals = await hospitalsRes.json();
          }
        } catch {
          // Hospitals data not available yet
          console.log("Hospitals data not available yet");
        }

        setState({
          resorts,
          clinics,
          hospitals,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "Failed to load data",
        }));
      }
    }

    loadData();
  }, []);

  return state;
}

export default useData;

