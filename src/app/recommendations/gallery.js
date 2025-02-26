"use client";
import React, { useState, useMemo, useEffect } from "react";
import InfoCard from "./infoCard";
import SortDropdown from "./sortDropdown";
import FilterDropdown from "./infoFilterDropdown";
import { fetchSafeRouteORS } from "@/utils/fetchSafeRouteORS";

async function fetchCsvAndParse(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`CSV fetch failed: ${response.status}`);
  }
  const text = await response.text();
  const lines = text.split(/\r?\n/);
  if (lines.length === 0) return {};
  const header = lines[0].split(",");
  const geoidIndex = header.indexOf("GEOID");
  const peiIndex = header.indexOf("PEI");
  if (geoidIndex === -1 || peiIndex === -1) {
    throw new Error("CSV missing GEOID or PEI_score columns");
  }
  const scoreMap = {};
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].trim();
    if (!row) continue;
    const cols = row.split(",");
    const geoid = cols[geoidIndex];
    const pei = parseFloat(cols[peiIndex]);
    if (geoid && !isNaN(pei)) {
      scoreMap[geoid] = pei;
    }
  }
  return scoreMap;
}

// Merge PEI scores into GeoJSON features.
function mergePEIScoreIntoGeojson(geojson, scoreMap) {
  if (!geojson.features) return geojson;
  geojson.features.forEach((feature) => {
    const geoid = feature.properties?.GEOID;
    if (geoid && scoreMap[geoid] !== undefined) {
      feature.properties.PEI_score = scoreMap[geoid];
    }
  });
  return geojson;
}

/**
 * Maps raw amenity types (from the Google Places API) into filter groups.
 */
const getFilterCategories = (types) => {
  const categories = new Set();
  if (!types || !Array.isArray(types)) return [];
  types.forEach((type) => {
    const lower = type.toLowerCase();
    // HEALTH
    if (
      [
        "doctor",
        "health",
        "hospital",
        "pharmacy",
        "drugstore",
        "physiotherapist",
        "veterinary_care",
      ].includes(lower)
    ) {
      categories.add("Health");
    }
    // RETAIL
    if (
      [
        "supermarket",
        "convenience_store",
        "grocery_or_supermarket",
        "department_store",
        "furniture_store",
        "hardware_store",
        "clothing_store",
        "pet_store",
        "home_goods_store",
        "shoe_store",
        "shopping_mall",
      ].includes(lower)
    ) {
      categories.add("Retail");
    }
    // FOOD
    if (
      [
        "supermarket",
        "convenience_store",
        "grocery_or_supermarket",
        "store",
        "meal_delivery",
        "meal_takeaway",
        "restaurant",
        "bakery",
        "cafe",
      ].includes(lower)
    ) {
      categories.add("Food");
    }
    // SHELTER
    if (["lodging", "shelter"].includes(lower)) {
      categories.add("Shelter");
    }
    // CIVIC
    if (
      [
        "city_hall",
        "local_government_office",
        "police",
        "post_office",
        "travel_agency",
        "fire_station",
        "embassy",
        "lawyer",
        "insurance_agency",
        "real_estate_agency",
      ].includes(lower)
    ) {
      categories.add("Civic");
    }
    // Transportation group (remains defined but not available for filtering)
    if (
      [
        "train_station",
        "taxi_stand",
        "light_rail_station",
        "subway_station",
        "transit_station",
        "airport",
        "bicycle_store",
        "bus_station",
        "car_rental",
        "car_dealer",
        "car_repair",
      ].includes(lower)
    ) {
      categories.add("Transportation");
    }
    // New group: Financial Services
    if (["accounting", "bank"].includes(lower)) {
      categories.add("Financial Services");
    }
    // New group: Professional / Home Services
    if (["electrician", "locksmith", "moving_company"].includes(lower)) {
      categories.add("Professional / Home Services");
    }
  });
  return Array.from(categories);
};

// Helper to determine if a point [lng, lat] is inside a polygon represented as an array of [lng, lat] coordinates.
const pointInPolygon = (point, vs) => {
  let x = point[0],
    y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    let xi = vs[i][0],
      yi = vs[i][1];
    let xj = vs[j][0],
      yj = vs[j][1];
    let intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

// Helper to get walkability (PEI_score) for a recommendation based on its location.
const getWalkabilityScoreForRecommendation = (rec, geojson) => {
  if (!geojson || !geojson.features) return 0;
  // Use rec.geometry.location.lng/lat
  const point = [rec.geometry.location.lng, rec.geometry.location.lat];
  for (const feature of geojson.features) {
    const geom = feature.geometry;
    if (geom.type === "Polygon") {
      for (const ring of geom.coordinates) {
        if (pointInPolygon(point, ring)) {
          return feature.properties.PEI_score || 0;
        }
      }
    } else if (geom.type === "MultiPolygon") {
      for (const polygon of geom.coordinates) {
        for (const ring of polygon) {
          if (pointInPolygon(point, ring)) {
            return feature.properties.PEI_score || 0;
          }
        }
      }
    }
  }
  return 0;
};

const geoJsonUrl =
  "https://storage.googleapis.com/woohack25/atlanta_blockgroup_PEI_2022.geojson?cachebust=1";
const csvUrl =
  "https://storage.googleapis.com/woohack25/atlanta_blockgroup_PEI_2022.csv?cachebust=1";

const Gallery = ({
  recommendations,
  userLocation,
  geminiExplanations,
  user,
  galleryExpanded,
  onSetDestination,
}) => {
  // Dropdown states
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState(""); // Options: "ETA" or "Walkability"
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [filterSearch, setFilterSearch] = useState("");

  const [walkabilityData, setWalkabilityData] = useState(null);
  const [etaMap, setEtaMap] = useState({});

  // Fetch walkability data (CSV and GeoJSON) and merge PEI scores
  useEffect(() => {
    const fetchWalkabilityData = async () => {
      try {
        const scoreMap = await fetchCsvAndParse(csvUrl);
        const geoRes = await fetch(geoJsonUrl);
        if (!geoRes.ok) {
          throw new Error(`GeoJSON fetch failed: ${geoRes.status}`);
        }
        const geojson = await geoRes.json();
        mergePEIScoreIntoGeojson(geojson, scoreMap);
        setWalkabilityData(geojson);
      } catch (error) {
        console.error("Error fetching walkability data:", error);
      }
    };
    fetchWalkabilityData();
  }, []);

  // Fetch real ETA values for each recommendation using fetchSafeRouteORS.
  useEffect(() => {
    async function fetchEtas() {
      const newEtaMap = {};
      for (const rec of recommendations) {
        try {
          const routeData = await fetchSafeRouteORS(
            userLocation,
            { lat: rec.geometry.location.lat, lng: rec.geometry.location.lng },
            localStorage.getItem("firePolygonsCollection")
          );
          // Store only ETA
          newEtaMap[rec.place_id] = routeData.eta;
        } catch (error) {
          console.error(`Error fetching ETA for ${rec.place_id}:`, error);
          newEtaMap[rec.place_id] = 0;
        }
      }
      setEtaMap(newEtaMap);
    }
    if (recommendations.length > 0) {
      fetchEtas();
    }
  }, [recommendations, userLocation]);

  // Simplify enhanced recommendations
  const enhancedRecommendations = useMemo(() => {
    return recommendations.map((rec) => ({
      ...rec,
      dummyETA: etaMap[rec.place_id] || 0,
      walkability: walkabilityData
        ? Number(
            getWalkabilityScoreForRecommendation(rec, walkabilityData).toFixed(
              2
            )
          )
        : null,
    }));
  }, [recommendations, walkabilityData, etaMap]);

  // Fixed filter groups (in desired order)
  const fixedFilters = [
    "Health",
    "Retail",
    "Food",
    "Shelter",
    "Civic",
    "Transportation",
    "Financial Services",
    "Professional / Home Services",
  ];

  // Create filters if amenities exist for that tag
  const existingFilterOptions = useMemo(() => {
    const existing = new Set();
    enhancedRecommendations.forEach((rec) => {
      if (rec.types) {
        const cats = getFilterCategories(rec.types);
        cats.forEach((cat) => existing.add(cat));
      }
    });
    return fixedFilters.filter((option) => existing.has(option));
  }, [enhancedRecommendations, fixedFilters]);

  // Filter options
  const filteredFilterOptions = useMemo(() => {
    return existingFilterOptions.filter((option) =>
      option.toLowerCase().includes(filterSearch.toLowerCase())
    );
  }, [existingFilterOptions, filterSearch]);

  // Filter amenities by categories
  // No filters -> include all amenities
  const filteredRecommendations = useMemo(() => {
    if (selectedFilters.length > 0) {
      return enhancedRecommendations.filter(
        (rec) =>
          rec.types &&
          getFilterCategories(rec.types).some((t) =>
            selectedFilters.includes(t)
          )
      );
    }
    return enhancedRecommendations;
  }, [enhancedRecommendations, selectedFilters]);

  // Apply the selected sort order on the filtered recommendations.
  console.log("filteredRecommendations", filteredRecommendations);
  const sortedRecommendations = useMemo(() => {
    let recs = [...filteredRecommendations];
    if (selectedSort === "ETA") {
      recs.sort((a, b) => a.dummyETA - b.dummyETA);
    } else if (selectedSort === "Walkability") {
      recs.sort((a, b) => b.walkability - a.walkability);
    }
    return recs;
  }, [filteredRecommendations, selectedSort]);

  // Always display at most 15 amenities
  const displayedRecommendations = sortedRecommendations.slice(0, 15);

  const cardsContainerStyle = galleryExpanded
    ? {
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gridTemplateRows: "repeat(3, auto)",
        gap: "10px",
      }
    : { display: "flex", flexDirection: "column", gap: "10px" };

  return (
    <div className="gallery h-[68vh] overflow-y-auto p-4">
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "10px",
          position: "relative",
          zIndex: 101,
          gap: "10px",
        }}
      >
        {/* Sort Dropdown */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => {
              setSortDropdownOpen(!sortDropdownOpen);
              if (!sortDropdownOpen) {
                setFilterDropdownOpen(false);
              }
            }}
          >
            Sort by {selectedSort ? `: ${selectedSort}` : ""}
          </button>
          {sortDropdownOpen && (
            <SortDropdown
              selectedSort={selectedSort}
              setSelectedSort={(val) => {
                setSelectedSort(val);
                setSortDropdownOpen(false);
              }}
            />
          )}
        </div>
        {/* Filter Dropdown */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => {
              setFilterDropdownOpen(!filterDropdownOpen);
              if (!filterDropdownOpen) {
                setSortDropdownOpen(false);
              }
            }}
          >
            Filter{" "}
            {selectedFilters.length > 0
              ? `(${selectedFilters.join(", ")})`
              : ""}
          </button>
          {filterDropdownOpen && (
            <FilterDropdown
              filterSearch={filterSearch}
              setFilterSearch={setFilterSearch}
              filteredFilterOptions={filteredFilterOptions}
              selectedFilters={selectedFilters}
              setSelectedFilters={setSelectedFilters}
            />
          )}
        </div>
      </div>

      {/* Display selected filters as removable tags with reduced vertical padding */}
      {selectedFilters.length > 0 && (
        <div style={{ marginBottom: "10px" }}>
          {selectedFilters.map((filter) => (
            <span
              key={filter}
              style={{
                backgroundColor: "#007BFF",
                color: "#fff",
                padding: "3px 10px",
                borderRadius: "15px",
                marginRight: "5px",
                display: "inline-flex",
                alignItems: "center",
                fontSize: "0.9rem",
              }}
            >
              {filter}
              <span
                style={{ marginLeft: "5px", cursor: "pointer" }}
                onClick={() =>
                  setSelectedFilters(
                    selectedFilters.filter((f) => f !== filter)
                  )
                }
              >
                &#x2715;
              </span>
            </span>
          ))}
        </div>
      )}

      <div style={cardsContainerStyle}>
        {displayedRecommendations.length > 0 ? (
          displayedRecommendations.map((place, index) => (
            <InfoCard
              key={index}
              place={place}
              userLocation={userLocation}
              geminiExplanation={geminiExplanations[place.place_id]}
              user={user}
              onSetDestination={onSetDestination}
            />
          ))
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
};

export default Gallery;
