# PulseCity's own map

PulseCity draws its map with [MapLibre](https://maplibre.org) from a single
[PMTiles](https://docs.protomaps.com/pmtiles/) file of Abuja, built from
OpenStreetMap data. The file ships with the app in `public/abuja.pmtiles`, so
there is no Google Maps API key, billing account or third-party map service.

## Create or refresh the map file

1. Install the PMTiles tool (macOS): `brew install pmtiles`
   (or download it from https://github.com/protomaps/go-pmtiles/releases).
2. Find the newest daily world build at https://maps.protomaps.com/builds
   (file names look like `20261102.pmtiles`).
3. From the project folder, cut out Abuja:

   ```
   pmtiles extract https://build.protomaps.com/20261102.pmtiles public/abuja.pmtiles \
     --bbox=7.20,8.80,7.70,9.25 --maxzoom=15
   ```

   Widen `--bbox` (west,south,east,north) to cover more of the FCT or Nigeria.
4. Commit `public/abuja.pmtiles` and push. Vercel serves it with the app.

To host the file elsewhere (for example Supabase Storage), set
`VITE_MAP_PMTILES_URL` to its public URL in Vercel's environment variables.

Map label fonts and icons load from the free Protomaps assets at
`protomaps.github.io/basemaps-assets`.

Map data © OpenStreetMap contributors.
