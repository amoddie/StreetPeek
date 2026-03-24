# StreetPeek - Sources

All data is presented for informational purposes only. StreetPeek does not score or rate listings. It surfaces publicly available data so you can make your own judgment.

## Listing info

The following are extracted from the listing page's embedded data and DOM:

- Review count
- Rating, if available
- Superhost status
- Identity verification status
- Photo count
- Response rate, if shown
- Years hosting

## Neighborhood

Neighborhood, city, and state data come from Nominatim / OpenStreetMap reverse geocoding.

## Nearby amenities

Nearby amenities come from the Overpass API / OpenStreetMap within a 1 km (0.6 mi) radius:

- Transit stops
- Grocery and convenience stores
- Hospitals and clinics
- Pharmacies
- Police stations
- Bars and clubs

## Crime data

Crime data is queried within an approximately 1 km x 1 km (0.6 mi) bounding box centered on the listing's map coordinates (+/-500 m in each direction). Only crimes in the immediate area are counted, not city-wide totals.

All crime counts include a per-month frequency, for example `~3.2/mo`.

Crimes are grouped as:

- Violent
- Property
- Other

### Supported coverage

| Location | API Type | Lookback Period |
|----------|----------|-----------------|
| New York | Socrata | 6 months |
| Los Angeles | Socrata | 6 months |
| Chicago | Socrata | 6 months |
| Dallas | Socrata | 6 months |
| San Francisco | Socrata | 6 months |
| Seattle | Socrata | 6 months |
| Philadelphia | Carto SQL | 6 months |
| Washington, DC | ArcGIS | 6 months |
| Denver | ArcGIS | 6 months |
| United Kingdom listings | UK Police API | 1 month |

## Data sources

| Source | API | Auth Required |
|--------|-----|---------------|
| Neighborhood name | Nominatim (OpenStreetMap) | No |
| Nearby amenities | Overpass API (OpenStreetMap) | No |
| New York crime | data.cityofnewyork.us (Socrata) | No |
| Los Angeles crime | data.lacity.org (Socrata) | No |
| Chicago crime | data.cityofchicago.org (Socrata) | No |
| Dallas crime | dallasopendata.com (Socrata) | No |
| San Francisco crime | data.sfgov.org (Socrata) | No |
| Seattle crime | data.seattle.gov (Socrata) | No |
| Philadelphia crime | phl.carto.com (Carto SQL) | No |
| Washington, DC crime | maps2.dcgis.dc.gov (ArcGIS) | No |
| Denver crime | services1.arcgis.com (ArcGIS) | No |
| United Kingdom crime | data.police.uk | No |

## Disclaimer

Independent tool. Not affiliated with or endorsed by Airbnb. All data is provided for informational purposes only and should not be used as the sole basis for booking decisions. Crime statistics, amenity counts, and location data may be incomplete, delayed, or approximate. Coverage varies by city and region.

Area data copyright: [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).
