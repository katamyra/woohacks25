"use client";
import React, {useState, useCallback, useEffect, useRef, useMemo} from "react";
import {GoogleMap, useJsApiLoader} from "@react-google-maps/api";
import CustomMarker from './CustomMarker'; // Import the CustomMarker component

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

// Updated Helper: Map confidence to opacity with more noticeable differences
const getOpacity = (confidence) => {
  switch (confidence) {
    case 'H':
      return 1.0;   // Fully opaque for high confidence
    case 'M':
      return 0.5;   // 50% opacity for medium confidence
    case 'L':
      return 0.2;   // 20% opacity for low confidence
    default:
      return 0.5;
  }
};

export default function MapOverlay({landsatData}) {
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
    console.log("Landsat Data:", landsatData);
  }, [])

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

  const center = useMemo(() => {
    if (!landsatData || landsatData.length === 0) {
      return { lat: 37.7749, lng: -122.4194 }; // Default center (San Francisco)
    }
    let sumLat = 0, sumLng = 0;
    landsatData.forEach((point) => {
      sumLat += parseFloat(point.lat);
      sumLng += parseFloat(point.lng);
    });
    return { lat: sumLat / landsatData.length, lng: sumLng / landsatData.length };
  }, [landsatData]);

  useEffect(() => {
    if (map && landsatData && landsatData.length > 0 && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      landsatData.forEach((point) => {
        bounds.extend(new window.google.maps.LatLng(parseFloat(point.lat), parseFloat(point.lng)));
      });
      map.fitBounds(bounds);
    }
  }, [map, landsatData]);

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

    try { 
      const scoreMap = await fetchCsvAndParse(csvUrl);

      const geoRes = await fetch(geoJsonUrl);
      if (!geoRes.ok) {
        throw new Error(`GeoJSON fetch failed: ${geoRes.status}`);
      }
      const geojson = await geoRes.json();
      mergePEIScoreIntoGeojson(geojson, scoreMap);

      map.data.forEach((f) => map.data.remove(f));
      map.data.addGeoJson(geojson);

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

  if (!isLoaded) return <p>Loading Map...</p>;

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

      <GoogleMap
        onLoad={onMapLoad}
        center={center}
        zoom={10}
        mapContainerStyle={{width: "100%", height: "100%"}}
      >
        {landsatData &&
          landsatData.map((dataPoint, index) => (
            <CustomMarker
              key={index}
              lat={parseFloat(dataPoint.lat)}
              lng={parseFloat(dataPoint.lng)}
              confidence={dataPoint.confidence}
              acqDate={dataPoint.acq_date}
              acqTime={dataPoint.acq_time}
            />
          ))}
      </GoogleMap>
    </div>
  );
}