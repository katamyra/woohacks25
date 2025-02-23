import React, { useState } from "react";
import InfoCard from "./infoCard";
import FilterDropdown from "./infoFilterDropdown";

const Gallery = ({ recommendations, userLocation, geminiExplanations, user }) => {
  const [filterOpen, setFilterOpen] = useState(false);
  return (
    <div className="gallery">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px", position: "relative" }}>
        <span style={{ cursor: "pointer" }} onClick={() => setFilterOpen(!filterOpen)}>
          🔍
        </span>
        {filterOpen && <FilterDropdown />}
      </div>
      {recommendations.length > 0 ? (
        recommendations.map((place, index) => (
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
