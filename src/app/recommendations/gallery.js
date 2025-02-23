// Gallery.jsx
import React, { useState } from "react";
import InfoCard from "./infoCard";
import FilterDropdown from "./infoFilterDropdown";

const Gallery = ({ recommendations, userLocation, geminiExplanations, user }) => {
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "20px" 
        }}>
        <h2>Recommended Locations</h2>
        <div style={{ position: "relative" }}>
          <span 
            style={{ cursor: "pointer", fontSize: "24px" }} 
            onClick={() => setFilterOpen(!filterOpen)}
          >
            🔍
          </span>
          {filterOpen && <FilterDropdown />}
        </div>
      </div>
      <div
        className="gallery-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px"
        }}
      >
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
    </div>
  );
};

export default Gallery;
