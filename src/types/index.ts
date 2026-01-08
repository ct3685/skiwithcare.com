// Re-export all types for convenient importing
// Usage: import { Resort, Facility, Hospital } from '@/types'

export * from "./resort";
export * from "./facility";
export * from "./clinic"; // Legacy - will be replaced by Facility
export * from "./hospital"; // Legacy - will be migrated to Facility
export * from "./location";

