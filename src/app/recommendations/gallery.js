// Gallery.js
import React, { useState, useMemo } from "react";
import InfoCard from "./infoCard";
import SortDropdown from "./sortDropdown";
import FilterDropdown from "./infoFilterDropdown";

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
      ["doctor", "health", "hospital", "pharmacy", "drugstore", "physiotherapist", "veterinary_care"].includes(lower)
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

const Gallery = ({ recommendations, userLocation, geminiExplanations, user, galleryExpanded }) => {
  // Dropdown states
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState(""); // Options: "ETA" or "Walkability"
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [filterSearch, setFilterSearch] = useState("");

  // Enhance recommendations with dummy ETA and walkability scores
  const enhancedRecommendations = useMemo(() => {
    return recommendations.map((rec) => ({
      ...rec,
      dummyETA:
        rec.dummyETA !== undefined
          ? rec.dummyETA
          : Math.floor(Math.random() * 30) + 5, // random between 5 and 35 minutes
      walkability:
        rec.walkability !== undefined
          ? rec.walkability
          : Math.floor(Math.random() * 100) + 1, // random score between 1 and 100
    }));
  }, [recommendations]);

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

  // Compute only those filter groups that have at least one corresponding amenity.
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

  // Filter available options based on the user's input.
  const filteredFilterOptions = useMemo(() => {
    return existingFilterOptions.filter((option) =>
      option.toLowerCase().includes(filterSearch.toLowerCase())
    );
  }, [existingFilterOptions, filterSearch]);

  // When filters are selected, only include recommendations that have at least one matching filter group.
  // If no filters are selected, include all recommendations.
  const filteredRecommendations = useMemo(() => {
    if (selectedFilters.length > 0) {
      return enhancedRecommendations.filter(
        (rec) =>
          rec.types &&
          getFilterCategories(rec.types).some((t) => selectedFilters.includes(t))
      );
    }
    return enhancedRecommendations;
  }, [enhancedRecommendations, selectedFilters]);

  // Apply the selected sort order on the filtered recommendations.
  const sortedRecommendations = useMemo(() => {
    let recs = [...filteredRecommendations];
    if (selectedSort === "ETA") {
      recs.sort((a, b) => a.dummyETA - b.dummyETA);
    } else if (selectedSort === "Walkability") {
      recs.sort((a, b) => a.walkability - b.walkability);
    }
    return recs;
  }, [filteredRecommendations, selectedSort]);

  // Always display at most 15 amenities.
  const displayedRecommendations = sortedRecommendations.slice(0, 15);

  return (
    <div className="gallery">
      {/* Dropdown controls with higher z-index, gap for separation, and mutual collapse logic */}
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

      {/* Render the (up to 15) amenity InfoCards */}
      {displayedRecommendations.length > 0 ? (
        displayedRecommendations.map((place, index) => (
          <InfoCard
            key={index}
            place={place}
            userLocation={userLocation}
            geminiExplanation={geminiExplanations[place.place_id]}
            user={user}
          />
        ))
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default Gallery;
