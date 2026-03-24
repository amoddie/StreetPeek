# StreetPeek

Chrome extension that shows approximate Google Street View, nearby amenities, and public crime data for supported locations on rental listing pages so you can explore the neighborhood before booking.

> Independent tool. Not affiliated with or endorsed by Airbnb.

![StreetPeek demo](./streetpeek-demo.gif)

## How it works

1. Navigate to any listing page on a supported site
2. Click the **StreetPeek** button in the bottom-right corner
3. A panel opens with listing info, area data, and an embedded Street View of the approximate area
4. Click **Open Full View** for the full interactive Google Street View

## Install (developer mode)

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right)
3. Click **Load unpacked** and select this project folder
4. Go to any listing page and look for the button in the bottom-right

## Supported sites

Works on Airbnb listing pages:

- airbnb.com
- airbnb.co.uk
- airbnb.ca
- airbnb.com.au

## Crime data coverage

Crime data is currently pulled for:

- New York
- Los Angeles
- Chicago
- Dallas
- San Francisco
- Seattle
- Philadelphia
- Washington, DC
- Denver
- United Kingdom listings via the UK Police API

See [SOURCES.md](SOURCES.md) for the full methodology and source list. Crime data is not available for all locations.

## How it finds the location

The extension reads the current listing page's embedded data (JSON, map images, or meta tags) to extract approximate latitude/longitude coordinates. No API keys are required.

## Third-party services

This extension sends the extracted coordinates to the following third-party services to retrieve area information. No data is sent to any developer-controlled server.

- **Nominatim / OpenStreetMap** - reverse geocoding
- **Overpass API / OpenStreetMap** - nearby amenity counts
- **City open-data portals** - public crime statistics for New York, Los Angeles, Chicago, Dallas, San Francisco, Seattle, Philadelphia, Washington, DC, and Denver
- **UK Police API** - public crime statistics for United Kingdom listings
- **Google Maps** - embedded Street View and map links

Area data copyright: [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).

## Privacy

See [PRIVACY.md](PRIVACY.md) for the full privacy policy.

## Disclaimer

All data is provided for informational purposes only and should not be used as the sole basis for booking decisions. Crime statistics, amenity counts, and location data may be incomplete, delayed, or approximate. Coverage varies by city and region.
