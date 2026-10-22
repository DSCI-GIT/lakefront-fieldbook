# Lakefront Fieldbook

A mobile, offline-ready transformer inspection map for Drone Services Canada. Static frontend hosted on GitHub Pages. Crew-code protected cloud sync stores the shared activity log in an R2 bucket via a small Worker.

## Field use

1. Open the published site online before leaving. In Settings enter your name and the crew code supplied separately.
2. Select **Keep this job offline** and confirm **Offline map saved**. Add the app to your phone's home screen if desired.
3. Tap **My position** and allow location access. The accuracy circle is the phone's reported GPS accuracy. It is not survey positioning.
4. Select a pole marker or search by pole ID, transformer ID or street. Tap **Mark photographed**. Notes can be added separately, or typed before marking photographed.
5. Amber means to do. Green means complete. A question mark identifies a source record needing field verification.
6. The local save happens before a network request. Pending changes retry when the app is open and reconnects, on foregrounding, every 30 seconds, or when tapping the sync indicator. The operating system may suspend a closed/background app.
7. Export/share JSON regularly. Import it on another phone to merge activities. CSV exports the current per-pole summary. Import uses immutable IDs and does not duplicate the same record twice.

The shared code is case-insensitive. It is not embedded in public source or exports. GPS positions are not sent to the sync service. Inspection notes and activity are shared with anyone who has the crew code. Export files contain inspection records and should be shared deliberately.

## Offline map and imagery

Detailed Cobourg street geometry is bundled locally, including road names. This works offline without downloading commercial tiles. The default is **Offline streets**. Online streets use OpenStreetMap tiles. Satellite imagery is online only using Esri World Imagery with attribution. External tiles are not cached by the service worker. Google Maps is not configured; it requires a licensed API key and separate integration.

OpenStreetMap contributors provide bundled road geometry under ODbL: https://www.openstreetmap.org/copyright . Source geometry was downloaded for bbox 43.947,-78.226,44.000,-78.109 on October 21/22, 2026 using Overpass. Source data is in `data/streets.geojson`. Leaflet 1.9.4 is bundled under the BSD-2-Clause license.

## Inventory and records

The 431 map points come from the earlier Lakefront transformer KMZ/GeoJSON. 428 poles are explicitly marked as having transformers, 3 are ID-only candidates. Duplicate pole 2801 uses the newer inspection location. Pole coordinates and historical attributes are not a current transformer survey. No flight automation is provided.

Every completion, reopening and note is an immutable activity event. Notes are append-only so concurrent notes survive. The latest status is determined by device occurrence timestamp with event ID as a tie-breaker; keep phone clocks on automatic. All events remain in JSON exports even if a pole is reopened. The cloud uses conditional writes and retries to preserve simultaneous updates. No user should manually erase browser storage before exporting or syncing it.

## Development

Run `npm test` and serve this folder over HTTP on localhost, for example `python -m http.server 4173`. Production needs HTTPS for GPS and service workers. No build is required. The companion sync service is in the separate `lakefront-crew-sync` source checkout; `config.js` identifies its URL and job ID. Set the runtime secret `CREW_CODE` on that service, never in this repository.
