# StreetPeek - Privacy Policy

Last updated: 2026-03-23

## What this extension does

StreetPeek is a Chrome extension that displays neighborhood information alongside rental listing pages. It reads data from the current page, extracts approximate location coordinates, and retrieves publicly available area data from third-party services.

## What data is read from the page

When you visit a supported listing page, the extension reads:

- Embedded JSON data in the page's script tags (to extract approximate latitude/longitude coordinates)
- Visible page text (to extract listing details such as review count, rating, host status, and response rate)
- Image elements (to count listing photos and to extract coordinates from map image URLs if present)
- Meta tags (to extract geo-location data if present)

This data is read locally in your browser. It is not stored, logged, or persisted beyond the current page session.

## What data is sent to third parties

The extracted latitude and longitude coordinates are sent to the following third-party services to retrieve area information:

| Service | Data sent | Purpose |
|---------|-----------|---------|
| Nominatim (OpenStreetMap) | Latitude, longitude | Reverse geocoding to identify the neighborhood, city, and state |
| Overpass API (OpenStreetMap) | Latitude, longitude | Counting nearby amenities (transit, grocery, healthcare, etc.) |
| City open-data portals (Socrata, Carto, ArcGIS) | Latitude, longitude, date range | Retrieving public crime incident data near the coordinates |
| UK Police API (data.police.uk) | Latitude, longitude, date | Retrieving public crime data for United Kingdom listings |
| Google Maps (via iframe) | Latitude, longitude | Displaying embedded Street View of the approximate area |

Each service receives only the minimum data required for its function: approximate coordinates and, for crime data, a date range. No personal information, browsing history, account details, or listing URLs are sent.

## What data is stored locally

StreetPeek does not use local storage, cookies, IndexedDB, or any other client-side persistence mechanism. No data is saved between page loads or sessions.

## What data is sent to the developer

None. StreetPeek does not send any data to any developer-controlled server. There is no telemetry, analytics, crash reporting, or usage tracking of any kind.

## Accounts, advertising, and data sale

- No user accounts or sign-in are required or supported.
- No advertising is displayed.
- No data is sold, shared for advertising purposes, or used for any purpose beyond the user-facing features described above.

## Third-party privacy policies

Each third-party service has its own privacy policy and terms of use:

- OpenStreetMap (Nominatim, Overpass): https://wiki.osmfoundation.org/wiki/Privacy_Policy
- UK Police API: https://data.police.uk/about/#accessibility
- Google Maps: https://policies.google.com/privacy
- City open-data portals operate under their respective municipal open-data policies.

## Changes to this policy

Any changes to data practices will be reflected in this file and in the extension's version notes.

## Contact

For questions about this privacy policy, open an issue in the project's GitHub repository.
