"use client";
import React, {useState, useCallback, useEffect, useRef, useMemo} from "react";
import {GoogleMap, useJsApiLoader} from "@react-google-maps/api";

// DEFINE PEI SCORE MAP COLORS HERE
function getColor(value) {
  const score = Math.max(0, Math.min(1, value));
  return score > 0.95 ? '#006400'  // Dark Green
    : score > 0.9 ? '#228B22'  // Forest Green
    : score > 0.85 ? '#32CD32' // Lime Green
    : score > 0.8 ? '#7FFF00'  // Chartreuse
    : score > 0.7 ? '#ADFF2F' // Green-Yellow
    : score > 0.6 ? '#FFFF66'  // Light Yellow
    : score > 0.5 ? '#FFFF00'  // Bright Yellow
    : score > 0.4 ? '#FFD700'  // Gold
    : score > 0.3 ? '#FFA500'  // Orange
    : score > 0.2 ? '#FF4500'  // Orange-Red
    : score > 0.1 ? '#B22222'  // Firebrick
    : '#8B0000';               // Dark Red
}

export default function MapOverlay() {
  const [map, setMap] = useState(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [hoverScore, setHoverScore] = useState(null);
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  const {isLoaded} = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  });

  // GEOJSON GCS link
  const geoJsonUrl =
    "https://storage.googleapis.com/woohack25/atlanta_blockgroup_PEI_2022.geojson?cachebust=1";

  // CSV GCS link
  const csvUrl =
    "https://storage.googleapis.com/woohack25/atlanta_blockgroup_PEI_2022.csv?cachebust=1";

  const onMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
    mapInstance.data.setMap(null);
  }, []);

  useEffect(() => {
    if (map && window.google) {
      // Detect when mouse is hovering over a polygon; get PEI score
      map.data.addListener("mouseover", (e) => {
        const score = e.feature.getProperty("PEI_score");
        if (score !== undefined && score !== null) {
          setHoverScore(parseFloat(score));
        } else {
          setHoverScore(null);
        }
      });
      map.data.addListener("mouseout", () => {
        setHoverScore(null);
      });
    }
  }, [map]);


  // Helper function to fetch and parse PEI score CSV
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

  // Helper function to merge PEI score into GeoJSON
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

  const toggleGeoJson = async () => {
    if (!map) return;

    if (overlayVisible) { //Hide map
      map.data.setMap(null);
      setOverlayVisible(false);
      return;
    }

    try { //Show map
      // Fetch & parse CSV for PEI score
      const scoreMap = await fetchCsvAndParse(csvUrl);

      // Fetch GeoJSON
      const geoRes = await fetch(geoJsonUrl);
      if (!geoRes.ok) {
        throw new Error(`GeoJSON fetch failed: ${geoRes.status}`);
      }
      const geojson = await geoRes.json();
      // Merge PEI score into GeoJSON
      mergePEIScoreIntoGeojson(geojson, scoreMap);

      // Clear old data
      map.data.forEach((f) => map.data.remove(f));
      // Add new data
      map.data.addGeoJson(geojson);

      // Apply interpolated colors of polygons based on PEI score
      map.data.setStyle((feature) => {
        const score = feature.getProperty("PEI_score") || 0.0;
        const color = getColor(score);
        return {
          fillColor: color,
          fillOpacity: 0.2,
          strokeWeight: 1,
        };
      });

      map.data.setMap(map);
      setOverlayVisible(true);
    } catch (error) {
      console.error("Error toggling overlay:", error);
    }
  };

  // Define where to center the map
  // Memoize to prevent resetting view center on renders
  const center = useMemo(() => ({ lat: 37.7749, lng: -122.4194 }), []);
  
  if (!isLoaded) return <p>Loading Map...</p>;

  // Style for both "Show/Hide Walkability" button and "PEI Score" display
  const commonStyle = {
    background: isButtonHovered ? "rgb(235, 235, 235)" : "#fff",
    boxShadow: "0 0px 2px rgba(24, 24, 24, 0.3)",
    color: "rgb(86, 86, 86)",
    fontFamily: "Roboto, Arial, sans-serif",
    fontSize: "17px",
    lineHeight: "36px",
    boxSizing: "border-box",
    height: "40px",
    padding: "0 12px",
    display: "flex",
    alignItems: "center",
    textAlign: "center",
    width: "152px",
  };

  // Style the walkability score display
  const scoreDisplayStyle = {
    ...commonStyle,
    borderRadius: "0 2px 2px 0",
    background: "#4285F4",
    color: "#fff",
    cursor: "default",
  };

  return (
    <div style={{flex: 1, position: "relative"}}>
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "168px",
          zIndex: 999,
          display: "flex",
          alignItems: "center",
        }}
      >

      <button
        onClick={toggleGeoJson}
        style={{...commonStyle, cursor: "pointer"}}
        onMouseEnter={() => setIsButtonHovered(true)}
        onMouseLeave={() => setIsButtonHovered(false)}
      >
        {overlayVisible ? "Hide Walkability" : "Show Walkability"}
      </button>

      {overlayVisible && (
        <div style={scoreDisplayStyle}>
          {hoverScore !== null
            ? `Walkability: ${hoverScore.toFixed(2)}`
            : "Walkability: ____"}
        </div>
      )}
      </div>

      {/* map default view settings */}
      <GoogleMap
        onLoad={onMapLoad}
        center={center}
        zoom={10}
        mapContainerStyle={{width: "100%", height: "100%"}}
      >
        {/* TODO: include overlay of pins on recommended locations */}
      </GoogleMap>
    </div>
  );
}