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
git clone <your-repo-url>
cd skiwithcare

# First time: set up Python venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Build and serve
pnpm start

# Open in browser
open http://localhost:8000
```

The build step generates the JSON data files in `public/` from the latest CMS data.

---

## 📁 Project Structure

```
├── public/                     # Deployed to Netlify
│   ├── index.html              # Main dashboard
│   ├── resorts.json            # 37 Epic Pass US resorts (generated)
│   ├── clinics.json            # 1,590+ DaVita clinics (generated)
│   ├── logo-512.png            # App icon
│   ├── og-image.png            # Social preview image
│   ├── sitemap.xml             # SEO sitemap
│   └── robots.txt              # Search engine directives
├── .cursor/                    # AI collaboration rules
│   └── rules                   # Brand + coding guidelines
├── epic_davita.py              # Data generator script
├── resort_geocoded_cache.json  # Cached resort coordinates
├── davita_geocoded_cache.json  # Cached clinic coordinates
├── netlify.toml                # Netlify config (build, redirects, headers)
├── package.json                # NPM scripts for local dev
└── requirements.txt            # Python dependencies
```

---

## 🔄 Data Updates

### Automatic (Netlify)

Data is automatically refreshed on every deploy. The build process:

1. Downloads latest CMS dialysis facility data
2. Uses cached geocodes for speed (~3 seconds)
3. Outputs fresh `resorts.json` and `clinics.json`

### Manual (Local)

```bash
# Using pnpm (requires venv to be set up)
pnpm start           # Build + serve in one command
pnpm build           # Generate JSON files (~3 sec with cache)
pnpm build:fresh     # Full refresh (~10 min, re-geocodes everything)
pnpm serve           # Just serve (if JSON already exists)

# Or directly with venv Python
./venv/bin/python epic_davita.py
cd public && python3 -m http.server 8000
```

**Note:** First run takes ~10 minutes due to geocoding rate limits. Subsequent runs use cached coordinates and complete in ~3 seconds.

---

## 🛠️ Tech Stack

| Layer           | Technology                                |
| --------------- | ----------------------------------------- |
| **Frontend**    | Vanilla JS, HTML, CSS                     |
| **Maps**        | Leaflet + MarkerCluster                   |
| **Tiles**       | CARTO (Dark/Light)                        |
| **Data**        | Static JSON (no backend needed)           |
| **Geocoding**   | OpenStreetMap Nominatim, US Census Bureau |
| **Data Source** | CMS Provider Data Catalog                 |
| **Analytics**   | Google Analytics 4                        |

**Zero external frameworks. Zero API keys. Zero backend.**

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
