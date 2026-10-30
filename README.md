# Hong Kong Airbnb — Geography of Preference

**Interactive data visualization · Group project (AI & Society)**

[**Live interactive dashboard**](https://0-sigma-puce.vercel.app) · [**Source code**](https://github.com/WuqianMa/Group-Projects-AI-and-Society)

An exploratory dashboard for examining the geography of Hong Kong Airbnb listings and guest reviews. It combines interactive maps, regional comparisons, review-segment analysis, and text visualizations to make spatial patterns easier to explore.

## What you can explore

- **Geographic patterns:** Compare review density (reviews per km²) across Hong Kong districts using a choropleth map, or switch to a listing-location heatmap.
- **Drill-down exploration:** Navigate from all of Hong Kong to its regions and districts, with linked contextual charts.
- **Review segments:** Explore data by review language, stay-length category, or group-size category where available in the processed data.
- **Housing mix:** Compare entire homes/apartments and private rooms across regions and segments.
- **Contextual indicators:** View population versus review density and room-type composition by district.
- **Text exploration:** Examine review-topic proportions and word clouds for selected groups.
- **Exports:** Download individual visualization panels or the dashboard's exportable panels as images.

## Dashboard preview

Try the [live dashboard](https://0-sigma-puce.vercel.app). Use **Compare by** to select language, stay length, or group size; switch between **District choropleth** and **Listing hotspots**; then click the map to inspect regional or district-level detail.

## Data and analytical approach

| Source / component | Role |
| --- | --- |
| Inside Airbnb — Hong Kong snapshot (2025-09-23) | Listings and review-related exploratory data |
| Hong Kong Census & Statistics Department — 2021 Population Census | Population context |
| Processed JSON and GeoJSON in `data/` | Geographic boundaries, aggregated indicators, segment distributions, and display-ready data |
| Review-density indicator | Reviews per square kilometre; **not** bookings or revenue |

The repository contains the **dashboard and prepared datasets**; it does not present the complete original data-preparation pipeline.

**Interpretation notes:** This is exploratory, observational analysis. Reviews are not a census of all stays, review language is not the same as nationality, and observed patterns should not be interpreted as causal effects or definitive measurements of traveller preferences.

## Technology

- **Frontend:** HTML, CSS, JavaScript
- **Maps:** Leaflet, Leaflet.heat, GeoJSON, OpenStreetMap / CARTO basemaps
- **Charts:** Apache ECharts and ECharts Word Cloud
- **Data:** Static JSON and GeoJSON bundles loaded in the browser
- **Export:** html2canvas and leaflet-image
- **Deployment:** Static site on Vercel

## Run locally

This is a static dashboard. Serve the repository over HTTP because browsers usually block JSON `fetch()` requests from `file://` URLs.

```bash
git clone https://github.com/WuqianMa/Group-Projects-AI-and-Society.git
cd Group-Projects-AI-and-Society
python3 -m http.server 8000
```

Then open **http://localhost:8000**.

Alternatively, run `python3 serve.py` and open **http://127.0.0.1:8765**.

## Repository structure

```text
├── index.html       # Dashboard layout and controls
├── css/             # Styling
├── js/              # Shared state, data loading, maps, charts, downloads
├── data/            # Prepared JSON and GeoJSON datasets
└── serve.py         # Small local static server
```

## Project context

Developed as a **group project in AI & Society**. This repository documents the shared dashboard and its implementation; individual team-member contributions are not specified here.

## Credits

Data: [Inside Airbnb](https://insideairbnb.com/) and Hong Kong Census & Statistics Department. Map tiles and geographic visualization libraries are credited in the dashboard itself.
