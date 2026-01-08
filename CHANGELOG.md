# Changelog

All notable changes to SkiWithCare will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-01-08 - Emergency Care Pivot

### Added
- **Urgent Care Mode** - Browse 1,200+ urgent care facilities near ski resorts
- **Emergency Guide** - "Where Should I Go?" triage decision support modal
- **Emergency Banner** - Sticky 911 call button with dismiss functionality
- **Emergency FAB** - Floating 911 button on mobile devices
- **Ski Patrol Contacts** - 54 resorts enriched with ski patrol phone numbers
- **335 US Ski Resorts** - Expanded from ~100 to 335 resorts covering all states
- **DirectionsButton** - One-tap directions using native maps (Apple/Google)
- **ShareButton** - Web Share API with clipboard fallback
- **PWA Support** - Service worker for offline access, install prompt
- **Report Form** - User feedback for incorrect facility information
- **Filter Persistence** - Remember user's filter preferences in localStorage
- **Skeleton Loaders** - Better perceived performance during data loading
- **Accessibility** - Skip link, focus styles, reduced motion support
- **FreshnessIndicator** - Show data verification status
- **VirtualizedList** - Performance for large facility lists
- **E2E Tests** - Playwright tests for urgent care flow

### Changed
- App focus expanded from dialysis-only to general emergency care
- Updated meta tags for emergency care SEO
- Header mode buttons show emoji-only on mobile
- Added xs (480px) Tailwind breakpoint for mobile

### Data
- Urgent care data from OpenStreetMap (17 states, 1,238 facilities)
- Ski patrol data from resort websites
- All US ski resorts from curated list + geocoding

---

## [Unreleased] - React Rebuild

### Added

- **React 19 + TypeScript architecture** (complete rewrite)
- **Vite 7** build system with hot module replacement
- **Tailwind CSS** for styling (preserving existing design system)
- **Zustand** for state management with localStorage persistence
- **react-leaflet** for map integration
- Component library:
  - UI primitives (Button, Badge, Modal, Toast, Spinner, Slider, Input, Select)
  - Layout components (Header, Sidebar, SettingsDrawer)
  - Card components (ResortCard, ClinicCard, HospitalCard)
  - Map components (MapView, markers for all entity types)
- Settings Drawer with preferences:
  - Theme selection (Rose/Alpine/Glacier)
  - Dark/Light/Auto mode
  - Distance units (Miles/Kilometers)
  - Default view and distance settings
- Custom hooks for data loading and filtering
- TypeScript interfaces for all data types
- Netlify deployment configuration for Vite build

### Planned (Next Phase)

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
