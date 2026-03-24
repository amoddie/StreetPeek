(() => {
  "use strict";

  const PANEL_ID = "streetpeek-panel";
  const BUTTON_ID = "streetpeek-btn";

  // Extract lat/lng from the listing page's embedded data
  function extractCoordinates() {
    const scripts = document.querySelectorAll('script[id^="data-deferred-state"]');
    for (const script of scripts) {
      const coords = parseLatLngFromJSON(script.textContent);
      if (coords) return coords;
    }

    const nextData = document.getElementById("__NEXT_DATA__");
    if (nextData) {
      const coords = parseLatLngFromJSON(nextData.textContent);
      if (coords) return coords;
    }

    const allScripts = document.querySelectorAll("script:not([src])");
    for (const script of allScripts) {
      const coords = parseLatLngFromJSON(script.textContent);
      if (coords) return coords;
    }

    const mapImages = document.querySelectorAll('img[src*="maps.googleapis.com"]');
    for (const img of mapImages) {
      const match = img.src.match(/center=([-\d.]+)%2C([-\d.]+)/);
      if (match) {
        return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
      }
    }

    const geoLat = document.querySelector('meta[property="place:location:latitude"]');
    const geoLng = document.querySelector('meta[property="place:location:longitude"]');
    if (geoLat && geoLng) {
      return { lat: parseFloat(geoLat.content), lng: parseFloat(geoLng.content) };
    }

    return null;
  }

  // Match lat/lng pairs from JSON text
  function parseLatLngFromJSON(text) {
    if (!text || text.length < 10) return null;

    const patterns = [
      /"lat"\s*:\s*([-]?\d+\.\d{3,})\s*,\s*"lng"\s*:\s*([-]?\d+\.\d{3,})/,
      /"latitude"\s*:\s*([-]?\d+\.\d{3,})\s*,\s*"longitude"\s*:\s*([-]?\d+\.\d{3,})/,
      /"lat"\s*:\s*([-]?\d+\.\d{3,})[\s\S]{0,50}"lng"\s*:\s*([-]?\d+\.\d{3,})/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return { lat, lng };
        }
      }
    }

    return null;
  }

  // Street View embed URL (no API key needed)
  function getStreetViewEmbedURL(lat, lng) {
    return `https://www.google.com/maps?q=${lat},${lng}&layer=c&cbll=${lat},${lng}&cbp=11,0,0,0,0&output=svembed`;
  }

  // Street View link for new tab - source=outdoor avoids interior photospheres
  function getStreetViewLink(lat, lng) {
    return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}&source=outdoor`;
  }

  // Google Maps link for the area
  function getMapsLink(lat, lng) {
    return `https://www.google.com/maps/@${lat},${lng},17z`;
  }

  // Reverse geocode via Nominatim to get neighborhood name
  async function fetchNeighborhood(lat, lng) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=16&addressdetails=1`;
      const res = await fetch(url, {
        headers: { "User-Agent": "StreetPeek-ChromeExtension/1.0 (https://github.com)" },
      });
      const data = await res.json();
      const addr = data.address || {};
      return {
        neighborhood: addr.neighborhood || addr.suburb || addr.quarter || null,
        city: addr.city || addr.town || addr.village || null,
        state: addr.state || null,
        country: addr.country || null,
        displayName: data.display_name || null,
      };
    } catch {
      return null;
    }
  }

  // Query Overpass API for nearby amenities within a radius (metres)
  async function fetchNearbyAmenities(lat, lng, radius = 1000) {
    const query = `
      [out:json][timeout:10];
      (
        node["amenity"="hospital"](around:${radius},${lat},${lng});
        node["amenity"="clinic"](around:${radius},${lat},${lng});
        node["amenity"="pharmacy"](around:${radius},${lat},${lng});
        node["amenity"="police"](around:${radius},${lat},${lng});
        node["shop"="supermarket"](around:${radius},${lat},${lng});
        node["shop"="convenience"](around:${radius},${lat},${lng});
        node["amenity"="nightclub"](around:${radius},${lat},${lng});
        node["amenity"="bar"](around:${radius},${lat},${lng});
        node["highway"="bus_stop"](around:${radius},${lat},${lng});
        node["railway"="station"](around:${radius},${lat},${lng});
        node["railway"="tram_stop"](around:${radius},${lat},${lng});
        node["station"="subway"](around:${radius},${lat},${lng});
      );
      out body;
    `;
    try {
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: "data=" + encodeURIComponent(query),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const data = await res.json();
      const counts = {
        hospitals: 0,
        pharmacies: 0,
        police: 0,
        grocery: 0,
        nightlife: 0,
        transit: 0,
      };
      for (const el of data.elements) {
        const a = el.tags?.amenity;
        const s = el.tags?.shop;
        const h = el.tags?.highway;
        const r = el.tags?.railway;
        const st = el.tags?.station;
        if (a === "hospital" || a === "clinic") counts.hospitals++;
        else if (a === "pharmacy") counts.pharmacies++;
        else if (a === "police") counts.police++;
        else if (s === "supermarket" || s === "convenience") counts.grocery++;
        else if (a === "nightclub" || a === "bar") counts.nightlife++;
        if (h === "bus_stop" || r === "station" || r === "tram_stop" || st === "subway") counts.transit++;
      }
      return counts;
    } catch {
      return null;
    }
  }

  // Crime data sources - Socrata, ArcGIS, Carto, UK Police (all free, no key)
  const CRIME_SOURCES = {
    "New York": {
      url: "https://data.cityofnewyork.us/resource/5uac-w243.json",
      portal: "https://data.cityofnewyork.us/Public-Safety/NYPD-Complaint-Data-Current-Year-To-Date-/5uac-w243",
      latCol: "latitude", lngCol: "longitude",
      typeCol: "ofns_desc", dateCol: "cmplnt_fr_dt",
      type: "socrata",
    },
    "Los Angeles": {
      url: "https://data.lacity.org/resource/2nrs-mtv8.json",
      portal: "https://data.lacity.org/Public-Safety/Crime-Data-from-2020-to-Present/2nrs-mtv8",
      latCol: "lat", lngCol: "lon",
      typeCol: "crm_cd_desc", dateCol: "date_occ",
      type: "socrata",
    },
    "Chicago": {
      url: "https://data.cityofchicago.org/resource/ijzp-q8t2.json",
      portal: "https://data.cityofchicago.org/Public-Safety/Crimes-2001-to-Present/ijzp-q8t2",
      latCol: "latitude", lngCol: "longitude",
      typeCol: "primary_type", dateCol: "date",
      type: "socrata",
    },
    "Dallas": {
      url: "https://www.dallasopendata.com/resource/qv6i-rri7.json",
      portal: "https://www.dallasopendata.com/Public-Safety/Police-Incidents/qv6i-rri7",
      latCol: "geocoded_column.latitude", lngCol: "geocoded_column.longitude",
      typeCol: "nibrs_crime_category", dateCol: "date1",
      type: "socrata",
    },
    "San Francisco": {
      url: "https://data.sfgov.org/resource/wg3w-h783.json",
      portal: "https://data.sfgov.org/Public-Safety/Police-Department-Incident-Reports-2018-to-Present/wg3w-h783",
      latCol: "latitude", lngCol: "longitude",
      typeCol: "incident_subcategory", dateCol: "incident_date",
      type: "socrata",
    },
    "Seattle": {
      url: "https://data.seattle.gov/resource/tazs-3rd5.json",
      portal: "https://data.seattle.gov/Public-Safety/SPD-Crime-Data-2008-Present/tazs-3rd5",
      latCol: "latitude", lngCol: "longitude",
      typeCol: "offense_category", dateCol: "offense_date",
      type: "socrata",
    },
    "Philadelphia": {
      type: "philly",
      portal: "https://opendataphilly.org/datasets/crime-incidents/",
    },
    "Washington": {
      type: "arcgis", city: "dc",
      portal: "https://opendata.dc.gov/datasets/crime-incidents-in-the-last-30-days",
    },
    "Denver": {
      type: "arcgis", city: "denver",
      portal: "https://www.denvergov.org/opendata/dataset/city-and-county-of-denver-crime",
    },
  };

  // Classify a crime description as violent, property, or other
  function classifyCrime(description) {
    if (!description) return "other";
    const d = description.toUpperCase();
    const violent = ["ASSAULT", "ROBBERY", "MURDER", "HOMICIDE", "RAPE", "SHOOTING",
      "WEAPON", "KIDNAP", "MANSLAUGHTER", "BATTERY", "SEX OFFENSE", "ARSON"];
    const property = ["BURGLARY", "THEFT", "LARCENY", "STOLEN", "VANDALISM",
      "CRIMINAL MISCHIEF", "TRESPASS", "SHOPLIFTING", "MOTOR VEHICLE THEFT"];
    if (violent.some((v) => d.includes(v))) return "violent";
    if (property.some((p) => d.includes(p))) return "property";
    return "other";
  }

  // Fetch crime data for a supported US city via Socrata bounding box query
  // Box is ±0.0045 lat (~500m) and ±0.006 lng (~500m) = ~1km x 1km total (0.6 mi)
  async function fetchSocrataCrime(source, lat, lng) {
    const latOff = 0.0045;
    const lngOff = 0.006;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const dateStr = sixMonthsAgo.toISOString().slice(0, 10);

    // Use count query first to get total, then fetch types
    const where = `${source.latCol} > ${lat - latOff} AND ${source.latCol} < ${lat + latOff}` +
      ` AND ${source.lngCol} > ${lng - lngOff} AND ${source.lngCol} < ${lng + lngOff}` +
      ` AND ${source.dateCol} > '${dateStr}'`;

    const url = `${source.url}?$where=${encodeURIComponent(where)}&$limit=10000&$select=${encodeURIComponent(source.typeCol)}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.map((row) => row[source.typeCol]);
  }

  // Fetch crime data from Philadelphia's Carto API
  async function fetchPhillyCrime(lat, lng) {
    const offset = 0.0045;
    const lngOffset = 0.006;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const dateStr = sixMonthsAgo.toISOString().slice(0, 10);

    const query = `SELECT text_general_code FROM incidents_part1_part2 ` +
      `WHERE point_y > ${lat - offset} AND point_y < ${lat + offset} ` +
      `AND point_x > ${lng - lngOffset} AND point_x < ${lng + lngOffset} ` +
      `AND dispatch_date >= '${dateStr}'`;

    const url = `https://phl.carto.com/api/v2/sql?q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.rows || []).map((r) => r.text_general_code);
  }

  // ArcGIS endpoint configs per city
  const ARCGIS_CONFIGS = {
    dc: {
      url: "https://maps2.dcgis.dc.gov/dcgis/rest/services/FEEDS/MPD/MapServer/38/query",
      typeField: "OFFENSE",
      dateField: "REPORT_DAT",
      latField: "LATITUDE",
      lngField: "LONGITUDE",
    },
    denver: {
      url: "https://services1.arcgis.com/zdB7qR0BtYrg0Xpl/arcgis/rest/services/ODC_CRIME_OFFENSES_P2_V/FeatureServer/0/query",
      typeField: "OFFENSE_CATEGORY_ID",
      dateField: "FIRST_OCCURRENCE_DATE",
      latField: "GEO_LAT",
      lngField: "GEO_LON",
    },
  };

  // Fetch crime data from an ArcGIS REST endpoint
  async function fetchArcGISCrime(cityKey, lat, lng) {
    const config = ARCGIS_CONFIGS[cityKey];
    if (!config) return [];
    const latOff = 0.0045;
    const lngOff = 0.006;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const where = `${config.latField} > ${lat - latOff} AND ${config.latField} < ${lat + latOff}` +
      ` AND ${config.lngField} > ${lng - lngOff} AND ${config.lngField} < ${lng + lngOff}` +
      ` AND ${config.dateField} >= '${sixMonthsAgo.toISOString().slice(0, 10)}'`;

    const params = new URLSearchParams({
      where,
      outFields: config.typeField,
      resultRecordCount: "10000",
      f: "json",
    });

    const res = await fetch(`${config.url}?${params}`);
    const data = await res.json();
    return (data.features || []).map((f) => f.attributes[config.typeField]);
  }

  // Fetch crime data from UK Police API
  async function fetchUKCrime(lat, lng) {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 2);
    const dateStr = lastMonth.toISOString().slice(0, 7); // YYYY-MM
    const url = `https://data.police.uk/api/crimes-street/all-crime?lat=${lat}&lng=${lng}&date=${dateStr}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.map((c) => c.category);
  }

  // Classify UK crime categories to violent/property/other
  function classifyUKCrime(category) {
    const violent = ["violent-crime", "robbery", "possession-of-weapons", "public-order"];
    const property = ["burglary", "shoplifting", "theft-from-the-person",
      "vehicle-crime", "bicycle-theft", "criminal-damage-arson", "other-theft"];
    if (violent.includes(category)) return "violent";
    if (property.includes(category)) return "property";
    return "other";
  }

  // Main crime fetcher - detects city/country and routes to the right API
  async function fetchCrimeData(lat, lng, neighborhood) {
    if (!neighborhood) return null;

    const city = neighborhood.city || "";
    const country = neighborhood.country || "";

    try {
      // UK listings
      if (country === "United Kingdom" || country === "England" || country === "Wales") {
        const crimes = await fetchUKCrime(lat, lng);
        const counts = { total: crimes.length, violent: 0, property: 0, other: 0 };
        for (const c of crimes) {
          const cls = classifyUKCrime(c);
          counts[cls]++;
        }
        counts.source = "UK Police";
        counts.sourceURL = "https://data.police.uk/";
        counts.period = "last month";
        return counts;
      }

      // US city lookup
      const source = CRIME_SOURCES[city];
      if (!source) return null;

      let crimes;
      if (source.type === "philly") {
        crimes = await fetchPhillyCrime(lat, lng);
      } else if (source.type === "arcgis") {
        crimes = await fetchArcGISCrime(source.city, lat, lng);
      } else {
        crimes = await fetchSocrataCrime(source, lat, lng);
      }

      const counts = { total: crimes.length, violent: 0, property: 0, other: 0 };
      for (const desc of crimes) {
        const cls = classifyCrime(desc);
        counts[cls]++;
      }
      counts.source = city + " Open Data";
      counts.sourceURL = source.portal || null;
      counts.period = "last 6 months";
      return counts;
    } catch {
      return null;
    }
  }

  // Scrape all the page's embedded JSON into one big string
  function getPageDataText() {
    const sources = [
      ...document.querySelectorAll('script[id^="data-deferred-state"]'),
      document.getElementById("__NEXT_DATA__"),
    ].filter(Boolean);
    return sources.map((s) => s.textContent).join("");
  }

  // Scrape trust signals from the DOM and embedded data
  function extractSignals() {
    const signals = {};
    const pageText = getPageDataText();
    const bodyText = document.body.innerText;

    // Review count - look for "X reviews" text on the page
    const reviewCountMatch = bodyText.match(/(\d[\d,]*)\s+reviews?/i);
    signals.reviewCount = reviewCountMatch
      ? parseInt(reviewCountMatch[1].replace(/,/g, ""), 10)
      : 0;

    // Rating - look for rating value in page data or DOM
    const ratingMatch =
      pageText.match(/"overallRating"\s*:\s*([\d.]+)/) ||
      pageText.match(/"ratingValue"\s*:\s*([\d.]+)/) ||
      pageText.match(/"reviewScore"\s*:\s*([\d.]+)/);
    signals.rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

    // If no rating from JSON, try the DOM (e.g. "4.85" near a star)
    if (!signals.rating) {
      const domRating = bodyText.match(/(\d\.\d{1,2})\s*·/);
      if (domRating) signals.rating = parseFloat(domRating[1]);
    }

    // Superhost
    signals.isSuperhost =
      /superhost/i.test(bodyText) ||
      /"isSuperhost"\s*:\s*true/i.test(pageText);

    // Identity verified
    signals.isVerified =
      /identity.{0,5}verified/i.test(bodyText) ||
      /"isVerified"\s*:\s*true/i.test(pageText) ||
      /"identityVerified"\s*:\s*true/i.test(pageText);

    // Photo count - count listing photo elements or JSON entries
    const photoElements = document.querySelectorAll(
      '[data-testid="photo-viewer"] img, [class*="photo"] img, [class*="gallery"] img, picture img'
    );
    const jsonPhotoMatch = pageText.match(/"photos"\s*:\s*\[/g);
    // Count photo URLs in JSON as a fallback
    const photoURLs = pageText.match(/"baseUrl"\s*:\s*"https:\/\/[^"]+"/g);
    signals.photoCount = Math.max(
      photoElements.length,
      photoURLs ? photoURLs.length : 0
    );

    // Response rate
    const responseMatch = bodyText.match(/(\d{1,3})%\s+response\s+rate/i);
    signals.responseRate = responseMatch ? parseInt(responseMatch[1], 10) : null;

    // Years hosting
    const yearsMatch = bodyText.match(/(\d+)\s+years?\s+hosting/i);
    const monthsMatch = bodyText.match(/(\d+)\s+months?\s+hosting/i);
    signals.yearsHosting = yearsMatch
      ? parseInt(yearsMatch[1], 10)
      : monthsMatch
        ? parseInt(monthsMatch[1], 10) / 12
        : null;

    return signals;
  }

  // Build the info card HTML - purely informational
  function buildInfoHTML(signals, amenities, neighborhood, crimeData) {
    const R = "(within 0.6 mi)";
    const sections = [];

    // Neighborhood
    if (neighborhood) {
      const parts = [neighborhood.neighborhood, neighborhood.city, neighborhood.state].filter(Boolean);
      if (parts.length) {
        sections.push(`<div class="sneak-neighborhood">&#x1F4CD; ${parts.join(", ")}</div>`);
      }
    }

    // Listing info
    const listing = [];
    if (signals.reviewCount > 0) listing.push(signals.reviewCount + " reviews");
    else listing.push("No reviews");
    if (signals.rating) listing.push(signals.rating.toFixed(1) + " rating");
    if (signals.isSuperhost) listing.push("Superhost");
    if (signals.isVerified) listing.push("Identity verified");
    if (signals.photoCount > 0) listing.push(signals.photoCount + " photos");
    if (signals.responseRate !== null) listing.push(signals.responseRate + "% response rate");
    if (signals.yearsHosting !== null) {
      listing.push(signals.yearsHosting >= 1
        ? Math.round(signals.yearsHosting) + " years hosting"
        : "< 1 year hosting");
    }
    if (listing.length) {
      sections.push(`<div class="sneak-info-section">
        <div class="sneak-info-title">Listing</div>
        <div class="sneak-info-items">${listing.join(" &middot; ")}</div>
      </div>`);
    }

    // Amenities
    if (amenities) {
      const items = [];
      if (amenities.transit > 0) items.push(amenities.transit + " transit stops");
      if (amenities.grocery > 0) items.push(amenities.grocery + " grocery/convenience stores");
      if (amenities.hospitals > 0) items.push(amenities.hospitals + " hospitals/clinics");
      if (amenities.pharmacies > 0) items.push(amenities.pharmacies + " pharmacies");
      if (amenities.police > 0) items.push(amenities.police + " police stations");
      if (amenities.nightlife > 0) items.push(amenities.nightlife + " bars/clubs");
      if (items.length) {
        sections.push(`<div class="sneak-info-section">
          <div class="sneak-info-title">Nearby ${R}</div>
          <div class="sneak-info-items">${items.join(" &middot; ")}</div>
        </div>`);
      } else {
        sections.push(`<div class="sneak-info-section">
          <div class="sneak-info-title">Nearby ${R}</div>
          <div class="sneak-info-items">No amenities found</div>
        </div>`);
      }
    }

    // Crime
    if (crimeData) {
      const months = crimeData.period === "last month" ? 1 : 6;
      const perMo = (n) => Math.round(n / months * 10) / 10;
      const items = [];
      items.push(crimeData.total + " total (~" + perMo(crimeData.total) + "/mo)");
      items.push(crimeData.violent + " violent (~" + perMo(crimeData.violent) + "/mo)");
      items.push(crimeData.property + " property (~" + perMo(crimeData.property) + "/mo)");
      items.push(crimeData.other + " other");
      const srcLink = crimeData.sourceURL
        ? `<a href="${crimeData.sourceURL}" target="_blank" rel="noopener" class="sneak-source-link">${crimeData.source}</a>`
        : crimeData.source;
      sections.push(`<div class="sneak-info-section">
        <div class="sneak-info-title">Crime within 0.6 mi (${crimeData.period}, ${srcLink})</div>
        <div class="sneak-info-items">${items.join(" &middot; ")}</div>
      </div>`);
    }

    sections.push(`<div class="sneak-attribution">Area data &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a></div>`);

    return `<div class="sneak-info-card">${sections.join("")}</div>`;
  }

  // Add the Street View button to the page
  function injectButton() {
    if (document.getElementById(BUTTON_ID)) return;

    const btn = document.createElement("button");
    btn.id = BUTTON_ID;
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polygon points="12,6 16,14 8,14"/>
        <line x1="12" y1="14" x2="12" y2="18"/>
      </svg>
      <span>StreetPeek</span>
    `;
    btn.addEventListener("click", togglePanel);
    document.body.appendChild(btn);
  }

  // Toggle the Street View panel on/off
  async function togglePanel() {
    const existing = document.getElementById(PANEL_ID);
    if (existing) {
      existing.remove();
      return;
    }

    const coords = extractCoordinates();

    const panel = document.createElement("div");
    panel.id = PANEL_ID;

    if (!coords) {
      panel.innerHTML = `
        <div class="sneak-header">
          <h3>StreetPeek</h3>
          <button class="sneak-close" aria-label="Close">&times;</button>
        </div>
        <div class="sneak-body sneak-error">
          <p>Couldn't find the location for this listing.</p>
          <p>Try scrolling down to the map section first, then click the button again.</p>
        </div>
      `;
      panel.querySelector(".sneak-close").addEventListener("click", () => panel.remove());
      makeDraggable(panel, panel.querySelector(".sneak-header"));
      document.body.appendChild(panel);
      return;
    }

    const streetViewURL = getStreetViewLink(coords.lat, coords.lng);
    const mapsURL = getMapsLink(coords.lat, coords.lng);
    const embedURL = getStreetViewEmbedURL(coords.lat, coords.lng);
    panel.innerHTML = `
      <div class="sneak-header">
        <h3>StreetPeek</h3>
        <div class="sneak-header-actions">
          <a href="${streetViewURL}" target="_blank" rel="noopener" class="sneak-link" title="Open full Street View">
            Open Full View
          </a>
          <a href="${mapsURL}" target="_blank" rel="noopener" class="sneak-link" title="Open in Google Maps">
            Google Maps
          </a>
          <button class="sneak-close" aria-label="Close">&times;</button>
        </div>
      </div>
      <div class="sneak-body">
        <div id="sneak-info-container">
          <div class="sneak-loading-full">
            <div class="sneak-spinner"></div>
            <span>Fetching area info...</span>
          </div>
        </div>
        <iframe
          class="sneak-iframe"
          src="${embedURL}"
          allowfullscreen
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
        ></iframe>
        <p class="sneak-hint">Embedded view may be limited. Click <strong>Open Full View</strong> for the full interactive Street View. Street View shows the approximate area near the listing. The exact address is not available until after booking.</p>
        <p class="sneak-disclaimer">Independent tool. Not affiliated with or endorsed by Airbnb. Data is for informational purposes only and may be incomplete, delayed, or approximate.</p>
      </div>
    `;

    panel.querySelector(".sneak-close").addEventListener("click", () => panel.remove());
    makeDraggable(panel, panel.querySelector(".sneak-header"));
    document.body.appendChild(panel);

    // Fetch everything before showing the area details
    const signals = extractSignals();
    const [neighborhood, amenities] = await Promise.all([
      fetchNeighborhood(coords.lat, coords.lng),
      fetchNearbyAmenities(coords.lat, coords.lng),
    ]);

    // Crime data depends on neighborhood (need city name), so fetch after
    const crimeData = await fetchCrimeData(coords.lat, coords.lng, neighborhood);

    const container = document.getElementById("sneak-info-container");
    if (container) {
      container.innerHTML = buildInfoHTML(signals, amenities, neighborhood, crimeData);
    }
  }

  // Make an element draggable by its header
  function makeDraggable(element, handle) {
    let offsetX = 0;
    let offsetY = 0;
    let dragging = false;

    handle.style.cursor = "grab";

    handle.addEventListener("mousedown", (e) => {
      if (e.target.closest("a, button")) return;
      dragging = true;
      handle.style.cursor = "grabbing";
      offsetX = e.clientX - element.getBoundingClientRect().left;
      offsetY = e.clientY - element.getBoundingClientRect().top;
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      element.style.left = `${e.clientX - offsetX}px`;
      element.style.top = `${e.clientY - offsetY}px`;
      element.style.right = "auto";
      element.style.bottom = "auto";
    });

    document.addEventListener("mouseup", () => {
      dragging = false;
      handle.style.cursor = "grab";
    });
  }

  // Re-inject button on SPA navigation
  function watchForNavigation() {
    let lastURL = location.href;
    const observer = new MutationObserver(() => {
      if (location.href !== lastURL) {
        lastURL = location.href;
        const btn = document.getElementById(BUTTON_ID);
        const panel = document.getElementById(PANEL_ID);
        if (btn) btn.remove();
        if (panel) panel.remove();
        if (/\/rooms\/\d+/.test(location.pathname)) {
          setTimeout(injectButton, 1500);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    if (/\/rooms\/\d+/.test(location.pathname)) {
      injectButton();
    }
    watchForNavigation();
  }

  if (document.readyState === "complete") {
    init();
  } else {
    window.addEventListener("load", init);
  }
})();
