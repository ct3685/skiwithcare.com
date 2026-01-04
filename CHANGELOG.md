# Changelog

All notable changes to SkiWithCare will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - React Rebuild

### Added

- React 18 + TypeScript architecture
- Vite build system with hot module replacement
- Tailwind CSS for styling (preserving existing design system)
- Zustand for state management
- Settings Drawer with preferences:
  - Theme selection (Rose/Alpine/Glacier)
  - Dark/Light/Auto mode
  - Distance units (Miles/Kilometers)
  - Default view and distance settings
- Ikon Pass resort support (~50 additional destinations)
- All dialysis providers (not just DaVita)
  - DaVita
  - Fresenius
  - Independent clinics
- Hospital/emergency care data with trauma level ratings
- Comprehensive test suite:
  - Unit tests (Vitest)
  - Component tests (React Testing Library)
  - E2E tests (Playwright)
- TypeScript interfaces for all data types

### Changed

- Migrated from monolithic 3,400-line HTML to component architecture
- Theme selection moved from header dropdown to Settings Drawer
- Expanded data sources for broader coverage
- Restructured Python data generator into modular scripts

### Removed

- Inline CSS (~1,200 lines) moved to Tailwind utilities and theme files
- Inline JavaScript (~1,600 lines) moved to React components and hooks

---

## [1.0.0] - 2024-XX-XX (Pre-Rebuild)

### Features

- Epic Pass resort search (37 resorts)
- DaVita dialysis clinic finder (1,590+ clinics)
- Interactive Leaflet map with marker clustering
- Bidirectional search (resort → clinics, clinic → resorts)
- Geolocation support (GPS + address geocoding)
- Distance filtering (10-200 miles)
- 6 theme variants (Rose/Alpine/Glacier × Light/Dark)
- Mobile-responsive design with FAB
- Share functionality (Web Share API + clipboard fallback)
- Google Analytics 4 integration

