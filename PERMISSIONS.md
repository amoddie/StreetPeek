# StreetPeek - Permissions

This document summarizes the extension's permissions, third-party services, and data handling.

## Single purpose

StreetPeek displays neighborhood information for supported rental listing pages, including approximate Street View, nearby amenities, and public crime data for supported locations.

## Content script matches

- `https://www.airbnb.com/rooms/*`
- `https://www.airbnb.co.uk/rooms/*`
- `https://www.airbnb.ca/rooms/*`
- `https://www.airbnb.com.au/rooms/*`

The extension runs only on supported listing pages so it can read embedded page data and display the StreetPeek panel.

## Host permissions

Each host permission corresponds to a specific third-party API the extension calls:

| Permission | Used by | Purpose |
|------------|---------|---------|
| `nominatim.openstreetmap.org` | `fetchNeighborhood()` | Reverse geocoding coordinates to neighborhood name |
| `overpass-api.de` | `fetchNearbyAmenities()` | Querying nearby amenities from OpenStreetMap |
| `data.cityofnewyork.us` | `fetchSocrataCrime()` | New York public crime data |
| `data.lacity.org` | `fetchSocrataCrime()` | Los Angeles public crime data |
| `data.cityofchicago.org` | `fetchSocrataCrime()` | Chicago public crime data |
| `www.dallasopendata.com` | `fetchSocrataCrime()` | Dallas public crime data |
| `phl.carto.com` | `fetchPhillyCrime()` | Philadelphia public crime data |
| `data.sfgov.org` | `fetchSocrataCrime()` | San Francisco public crime data |
| `data.seattle.gov` | `fetchSocrataCrime()` | Seattle public crime data |
| `maps2.dcgis.dc.gov` | `fetchArcGISCrime()` | Washington, DC public crime data |
| `services1.arcgis.com` | `fetchArcGISCrime()` | Denver public crime data |
| `data.police.uk` | `fetchUKCrime()` | United Kingdom public crime data |

No permissions are requested beyond what is actively used by the current code.

## Privacy practices summary

- The extension reads page content on supported listing pages to extract approximate location coordinates and listing details.
- Extracted coordinates are sent to third-party public APIs to retrieve area information.
- No data is sent to any developer-controlled server.
- No data is stored locally or persisted between sessions.
- No analytics, telemetry, accounts, advertising, or data sale.

See [PRIVACY.md](PRIVACY.md) for the full privacy policy.

## Personal and sensitive user data

### Does the extension handle personal or sensitive user data?

The extension reads page content from listing pages the user is actively viewing. It extracts approximate geographic coordinates and listing metadata that is already visible on the page.

These coordinates are sent to third-party public data APIs. No personally identifiable information such as name, email, account data, or payment data is collected, stored, or transmitted.

### Is data transferred to third parties?

Yes. Coordinates are sent to the third-party services listed above because those services provide the area data shown in the extension.

### Is data sold or used for advertising?

No. Data is not sold, licensed, shared for advertising, or used for creditworthiness or lending purposes.

### Is data used outside the extension's single purpose?

No. All data processing serves the extension's single purpose of displaying neighborhood information.
