import type { Resort } from "@/types";

/**
 * Mock resort data for testing
 */
export const mockResorts: Resort[] = [
  {
    id: "Vail|CO",
    name: "Vail",
    state: "CO",
    lat: 39.6403,
    lon: -106.3742,
    passNetwork: "epic",
    region: "rockies",
  },
  {
    id: "Breckenridge|CO",
    name: "Breckenridge",
    state: "CO",
    lat: 39.4817,
    lon: -106.0384,
    passNetwork: "epic",
    region: "rockies",
  },
  {
    id: "Park City|UT",
    name: "Park City",
    state: "UT",
    lat: 40.6514,
    lon: -111.508,
    passNetwork: "epic",
    region: "rockies",
  },
  {
    id: "Aspen Snowmass|CO",
    name: "Aspen Snowmass",
    state: "CO",
    lat: 39.2084,
    lon: -106.9499,
    passNetwork: "ikon",
    region: "rockies",
  },
  {
    id: "Jackson Hole|WY",
    name: "Jackson Hole",
    state: "WY",
    lat: 43.5875,
    lon: -110.8279,
    passNetwork: "ikon",
    region: "rockies",
  },
  {
    id: "Stowe|VT",
    name: "Stowe",
    state: "VT",
    lat: 44.5303,
    lon: -72.7814,
    passNetwork: "epic",
    region: "northeast",
  },
];

/**
 * Get a single mock resort by name
 */
export function getMockResort(name: string): Resort | undefined {
  return mockResorts.find((r) => r.name === name);
}

/**
 * Get mock resorts filtered by pass network
 */
export function getMockResortsByPass(pass: string): Resort[] {
  return mockResorts.filter((r) => r.passNetwork === pass);
}
