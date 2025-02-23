"use client";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import { GoogleMap, useJsApiLoader, Polygon, DirectionsRenderer } from "@react-google-maps/api";
import * as turf from "@turf/turf";
import CustomMarker from "./CustomMarker";
import { fetchRouteInfo } from "@/utils/fetchRouteInfo";
import { useAuth } from "@/context/AuthContext";

function getColor(value) {
  const score = Math.max(0, Math.min(1, value));
  return score > 0.95 ? "#006400"
    : score > 0.9 ? "#228B22"
    : score > 0.85 ? "#32CD32"
    : score > 0.8 ? "#7FFF00"
    : score > 0.7 ? "#ADFF2F"
    : score > 0.6 ? "#FFFF66"
    : score > 0.5 ? "#FFFF00"
    : score > 0.4 ? "#FFD700"
    : score > 0.3 ? "#FFA500"
    : score > 0.2 ? "#FF4500"
    : score > 0.1 ? "#B22222"
    : "#8B0000";
}

const getOpacity = (confidence) => {
  switch (confidence) {
    case "H":
      return 1.0;
    case "M":
      return 0.5;
    case "L":
      return 0.2;
    default:
      return 0.5;
  }
};

export default function MapOverlay({ landsatData, recommendations }) {
  const { user } = useAuth();
  const [map, setMap] = useState(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [hoverScore, setHoverScore] = useState(null);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [directions, setDirections] = useState(null);
  // New state for the user's current location
  const [userLocation, setUserLocation] = useState(null);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  });

  // Get the user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error retrieving user location:", error);
          setUserLocation({ lat: 40.8117, lng: -81.9308 });
        }
      );
    } else {
      console.error("Geolocation not supported by this browser.");
      setUserLocation({ lat: 40.8117, lng: -81.9308 });
    }
  }, []);

  const onMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
    mapInstance.data.setMap(null);
  }, []);

  useEffect(() => {
    console.log("Landsat Data:", landsatData);
  }, [landsatData]);

  useEffect(() => {
    if (map && window.google) {
      map.data.addListener("mouseover", (e) => {
        const score = e.feature.getProperty("PEI_score");
        setHoverScore(score !== undefined && score !== null ? parseFloat(score) : null);
      });
      map.data.addListener("mouseout", () => setHoverScore(null));
    }
  }, [map]);

  // Set map center based on landsatData if available, otherwise use user's location
  const center = useMemo(() => {
    if (landsatData && landsatData.length > 0) {
      let sumLat = 0, sumLng = 0;
      landsatData.forEach((point) => {
        sumLat += parseFloat(point.lat);
        sumLng += parseFloat(point.lng);
      });
      return { lat: sumLat / landsatData.length, lng: sumLng / landsatData.length };
    } else if (userLocation) {
      return userLocation;
    } else {
      // Fallback default if neither landsatData nor geolocation is available
      return { lat: 40.8117, lng: -81.9308 };
    }
  }, [landsatData, userLocation]);

  useEffect(() => {
    if (map && landsatData && landsatData.length > 0 && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      landsatData.forEach((point) => {
        bounds.extend(new window.google.maps.LatLng(parseFloat(point.lat), parseFloat(point.lng)));
      });
      map.fitBounds(bounds);
    }
  }, [map, landsatData]);

  // --- Turf Integration: Create Buffer Polygons around each fire marker ---
  const firePolygons = useMemo(() => {
    if (!landsatData || landsatData.length === 0) return [];
    return landsatData.map((fire) => {
      const point = turf.point([parseFloat(fire.lng), parseFloat(fire.lat)]);
      const buffered = turf.buffer(point, 1000, { units: "meters" });
      return buffered;
    });
  }, [landsatData]);

  // --- Get Route Info using fetchRouteInfo ---
  const handleSafeRoute = async () => {
    if (!map || !user) return;

    // Define approximate coordinates for origin and destination.
    const originCoords = { lat: 33.760, lng: -84.392 }; // Centennial Olympic Park
    const destinationCoords = { lat: 33.775, lng: -84.396 }; // Georgia Institute of Technology

    let safeWaypoint = null;
    if (firePolygons.length) {
      const firePoly = firePolygons[0];
      const line = turf.lineString(firePoly.geometry.coordinates[0]);
      const lineLength = turf.length(line, { units: "meters" });
      const samplePoint = turf.along(line, lineLength / 2, { units: "meters" });
      const samplePointCoords = samplePoint.geometry.coordinates;
      safeWaypoint = { lat: samplePointCoords[1], lng: samplePointCoords[0] };
    }

    const routeData = await fetchRouteInfo(originCoords, destinationCoords, safeWaypoint, user);
    console.log("Route Data:", routeData);
    setRouteInfo(routeData);

    if (routeData.encodedPolyline && window.google && map) {
      const path = window.google.maps.geometry.encoding.decodePath(routeData.encodedPolyline);
      new window.google.maps.Polyline({
        map: map,
        path: path,
        strokeColor: "#4285F4",
        strokeWeight: 4,
      });
    }
  };

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

  const geoJsonUrl = "https://storage.googleapis.com/woohack25/atlanta_blockgroup_PEI_2022.geojson?cachebust=1";
  const csvUrl = "https://storage.googleapis.com/woohack25/atlanta_blockgroup_PEI_2022.csv?cachebust=1";

  const toggleGeoJson = async () => {
    if (!map) return;

    if (overlayVisible) {
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
    cursor: "pointer",
    marginRight: "10px",
  };

  const scoreDisplayStyle = {
    ...commonStyle,
    borderRadius: "0 2px 2px 0",
    background: "#4285F4",
    color: "#fff",
    cursor: "default",
  };

  return (
    <div style={{ flex: 1, position: "relative" }}>
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
          style={commonStyle}
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

        <button onClick={handleSafeRoute} style={commonStyle}>
          Get Safe Route
        </button>
      </div>

      <GoogleMap
        onLoad={onMapLoad}
        center={center}
        zoom={16}
        mapContainerStyle={{ width: "100%", height: "100%" }}
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

        {firePolygons.map((poly, idx) => (
          <Polygon
            key={idx}
            paths={poly.geometry.coordinates[0].map(([lng, lat]) => ({ lat, lng }))}
            options={{
              fillColor: "red",
              fillOpacity: 0.35,
              strokeColor: "red",
              strokeOpacity: 0.8,
              strokeWeight: 2,
            }}
          />
        ))}
      </GoogleMap>
    </div>
  );
}
