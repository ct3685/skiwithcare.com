# ⛷️ SkiWithCare

> **Care Near the Slopes** — Plan your ski trip with confidence

🌐 **Live at [skiwithcare.com](https://skiwithcare.com)**

An interactive web dashboard that helps dialysis patients and caregivers plan ski trips by finding DaVita clinics near Epic Pass ski resorts — or discover resorts near their local clinic.

![Resorts](https://img.shields.io/badge/Resorts-37-ff6b9d?style=flat-square) ![Clinics](https://img.shields.io/badge/Clinics-1,590+-64d9f7?style=flat-square) ![No API Keys](https://img.shields.io/badge/API_Keys-None_Required-4ade80?style=flat-square)

---

## 🎨 Brand Guidelines

| Element          | Value                                      |
| ---------------- | ------------------------------------------ |
| **Product Name** | SkiWithCare (CamelCase) or "Ski With Care" |
| **Tagline**      | Care Near the Slopes                       |
| **Domain**       | skiwithcare.com                            |
| **Tone**         | Calm, reassuring, trustworthy, supportive  |

### Official Logo Colors

| Element                  | Color             | Hex       |
| ------------------------ | ----------------- | --------- |
| **Skier/Mountain/Cross** | Pink              | `#e879a0` |
| **Wave**                 | Cyan              | `#64d9f7` |
| **Background**           | Deep Purple-Black | `#0f0a12` |

### Color Themes

| Theme       | Primary         | Secondary          | Vibe                   |
| ----------- | --------------- | ------------------ | ---------------------- |
| **Rose**    | Pink `#e879a0`  | Cyan `#64d9f7`     | Warm, caring (default) |
| **Alpine**  | Coral `#f97316` | Ice Blue `#38bdf8` | Adventurous            |
| **Glacier** | Teal `#14b8a6`  | Blue `#3b82f6`     | Cool, serene           |

Each theme has light and dark variants (6 total options). The **Rose** theme matches the official logo colors.

---

## ✨ Features

- **🔄 Bidirectional Search** — Search by resort to find clinics, or by clinic to find resorts
- **📍 Location Aware** — Use GPS or enter an address to find the closest options
- **🎚️ Distance Filter** — Adjustable slider (10-200 miles)
- **🗺️ Interactive Map** — Clustered markers with rich popups showing nearby locations
- **📤 Share** — Share resort/clinic links via Web Share API or clipboard
- **📱 Mobile First** — Responsive design with FAB, collapsible sidebar
- **🎨 6 Theme Options** — 3 color themes × light/dark modes
- **📊 Analytics** — Full GA4 event tracking

---

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/ct3685/skiwithcare.git
cd skiwithcare

# First time: set up Python venv
python3 -m venv venv
source venv/bin/activate
pip install -r scripts/requirements.txt

# Install npm dependencies
pnpm install

# Generate data files (resorts.json, clinics.json, etc.)
pnpm data:all

# Start development server
pnpm dev

# Open in browser
open http://localhost:3000
```

**Note:** Data files (`resorts.json`, `clinics.json`) are pre-generated and committed to the repo. To regenerate them, run `pnpm data:all` (requires Python venv setup).

---

## 📁 Project Structure

```
├── public/                     # Static assets (served as-is)
│   ├── resorts.json            # 37 Epic Pass US resorts (generated)
│   ├── clinics.json            # 1,590+ DaVita clinics (generated)
│   ├── hospitals.json          # Hospital data (generated)
│   ├── logo-512.png            # App icon
│   ├── og-image.png            # Social preview image
│   ├── sitemap.xml             # SEO sitemap
│   └── robots.txt              # Search engine directives
├── src/                        # React + TypeScript source code
│   ├── components/             # React components
│   ├── stores/                 # Zustand state management
│   ├── hooks/                  # Custom React hooks
│   └── utils/                  # Utility functions
├── scripts/                    # Python data generation scripts
│   ├── build_resorts.py        # Generate resorts data
│   ├── generate_data.py        # Generate clinics data
│   └── requirements.txt        # Python dependencies
├── index.html                  # Main entry point
├── netlify.toml                # Netlify config (build, redirects, headers)
└── package.json                # NPM scripts for local dev
```

---

## 🔄 Data Updates

### Automatic Updates

**Netlify Build:**
Data files are generated during each Netlify deployment. The build process:
1. Installs Python dependencies
2. Downloads latest CMS dialysis facility data
3. Uses cached geocodes for speed (~3 seconds with cache)
4. Falls back to fresh geocoding if cache is missing
5. Outputs fresh `resorts.json`, `clinics.json`, and `hospitals.json` to `public/`

**GitHub Actions (Weekly):**
Scheduled workflows run every Sunday at 6 AM UTC to update:
- Resort data from OpenStreetMap
- Hospital data from OpenStreetMap
- Changes are automatically committed to the repository

### Manual (Local)

```bash
# Using pnpm (requires venv to be set up)
pnpm dev             # Start development server
pnpm build           # Build production bundle
pnpm preview         # Preview production build
pnpm data:all        # Generate all data files (~3 sec with cache)
pnpm data:resorts    # Generate resorts data only
pnpm data:clinics    # Generate clinics data only

# Or directly with venv Python scripts
./venv/bin/python scripts/build_resorts.py
./venv/bin/python scripts/generate_data.py
cd public && python3 -m http.server 8000
```

**Note:** First run takes ~10 minutes due to geocoding rate limits. Subsequent runs use cached coordinates and complete in ~3 seconds.

---

## 🛠️ Tech Stack

| Layer           | Technology                                |
| --------------- | ----------------------------------------- |
| **Frontend**    | React + TypeScript + Vite                 |
| **Maps**        | Leaflet + MarkerCluster                   |
| **Tiles**       | CARTO (Dark/Light)                        |
| **Data**        | Static JSON (no backend needed)           |
| **Geocoding**   | OpenStreetMap Nominatim, US Census Bureau |
| **Data Source** | CMS Provider Data Catalog                 |
| **Analytics**   | Google Analytics 4                        |

**Zero API keys. Zero backend.**

---

## 📊 Data Sources

- **Resorts**: [Epic Pass](https://www.epicpass.com/) — All US owned/operated + partner resorts
- **Clinics**: [CMS Dialysis Facility Compare](https://data.cms.gov/provider-data/) — Filtered to DaVita chain
- **Geocoding**: OpenStreetMap Nominatim (resorts), US Census Bureau (clinics)

---

## 🤖 AI Collaboration

This project includes `.cursor/rules` with brand guidelines for AI assistants. When working with AI tools:

- Use the tagline "Care Near the Slopes"
- Maintain calm, reassuring tone (no hype language)
- Preserve the three color themes (Rose, Alpine, Glacier)
- Keep mobile-first, accessibility-focused design

---

## 👤 Author

**Cameron Taylor** — [@ct3685](https://github.com/ct3685)

---

## 📄 License

MIT — Use it however you'd like!

---

<p align="center">
  <strong>SkiWithCare</strong> — Care Near the Slopes<br>
  Made with ❤️ by <a href="https://github.com/ct3685">Cameron Taylor</a>
</p>
