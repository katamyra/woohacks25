"use client";
import React, { useState } from "react";
import MapOverlay from "./map_overlay";

const RecommendationsPage = () => {
  const [galleryExpanded, setGalleryExpanded] = useState(false);
  const toggleGallery = () => setGalleryExpanded(!galleryExpanded);

  // Main container
  const containerStyle = {
    display: "flex",
    height: "100vh",
    width: "100vw",
    margin: 0,
    padding: 0,
  };

  // Style the gallery section
  const galleryStyle = {
    flex: galleryExpanded ? 1 : 0.3,
    backgroundColor: "#f4f4f4",
    padding: "20px",
    overflowY: "auto",
    transition: "flex 0.3s ease",
    display: "flex",
    flexDirection: "column",
  };

  // Style the map section
  const mapStyle = {
    flex: 0.7,
    transition: "flex 0.3s ease",
    display: "flex",
    flexDirection: "column",
  };

  return (
    <div style={containerStyle}>
      {/* Recommended gallery section */}
      <div style={galleryStyle}>
        <button onClick={toggleGallery} style={{ marginBottom: "10px" }}>
          {galleryExpanded ? "Collapse Gallery" : "Expand Gallery"}
        </button>
        <h2>Recommended Locations</h2>
        <div>
          <p>No locations available yet.</p>
        </div>
      </div>

      {/* Map section */}
      {!galleryExpanded && (
        <div style={mapStyle}>
          <MapOverlay />
        </div>
      )}
    </div>
  );
};

export default RecommendationsPage;