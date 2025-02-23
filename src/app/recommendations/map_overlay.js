"use client";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import { GoogleMap, useJsApiLoader, Polygon, Marker } from "@react-google-maps/api";
import * as turf from "@turf/turf";
import CustomMarker from "./CustomMarker";
import { calculateWeightedPEIScore } from "@/utils/calculateLinestringPEI";
import { useAuth } from "@/context/AuthContext";
import { fetchSafeRouteORS } from "@/utils/fetchSafeRouteORS";
import { decodeORSGeometry } from "@/utils/decodeORSGeometry";


// Helper to get a color based on a numeric score.
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

export default function MapOverlay({ landsatData, recommendations, userLocation, destination }) {
  console.log("Recommendations:", recommendations)
  const { user } = useAuth();
  const [map, setMap] = useState(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [hoverScore, setHoverScore] = useState(null);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [currentUserLocation, setCurrentUserLocation] = useState(userLocation);
  const [mergedGeojson, setMergedGeojson] = useState(null);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  });

  // Get the user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error retrieving user location:", error);
        }
      );
    } else {
      console.error("Geolocation not supported by this browser.");
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
    } else if (currentUserLocation) {
      return currentUserLocation;
    } else {
      // Fallback default if neither landsatData nor geolocation is available
      return { lat: 40.8117, lng: -81.9308 };
    }
  }, [landsatData, currentUserLocation]);

  useEffect(() => {
    if (map && landsatData && landsatData.length > 0 && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      landsatData.forEach((point) => {
        bounds.extend(new window.google.maps.LatLng(parseFloat(point.lat), parseFloat(point.lng)));
      });
      map.fitBounds(bounds);
    }
  }, [map, landsatData]);

  // Avoid polygons from landsatData (fire polygons)
  const firePolygons = landsatData.map((dataPoint) => {
    const point = turf.point([dataPoint.lng, dataPoint.lat]);
    const polygon = turf.buffer(point, 1, { units: "kilometers" });
    return polygon.geometry.coordinates;
  });

  // Wrap polygons as a MultiPolygon for the ORS API
  const avoidPolygons = {
    type: "MultiPolygon",
    coordinates: firePolygons.map((coords) => coords),
  };

  // Automatically fetch and render the safe route when a destination is set.
  useEffect(() => {
    if (destination && map && window.google) {
      const getSafeRoute = async () => {
        try {
          const routeData = await fetchSafeRouteORS(
            currentUserLocation,
            destination,
            avoidPolygons,
            currentUserLocation
          );
          setRouteInfo(routeData);
          if (routeData.geometry) {
            const pathCoordinates = decodeORSGeometry(routeData.geometry);
            new window.google.maps.Polyline({
              map: map,
              path: pathCoordinates,
              strokeColor: "#4285F4",
              strokeWeight: 4,
            });
            console.log(`ETA (seconds): ${routeData.eta}`);
            console.log(`Distance (meters): ${routeData.distance}`);

            if (mergedGeojson && pathCoordinates.length > 0) {
              const weightedPEIScore = calculateWeightedPEIScore(routeData.geometry, mergedGeojson);
              if (weightedPEIScore !== null) {
                console.log("Weighted PEI Score along route (meters):", weightedPEIScore.toFixed(2));
              } else {
                console.log("Route does not intersect any PEI polygons.");
              }
            }
          }
        } catch (error) {
          console.error("Error fetching safe route via ORS:", error);
        }
      };
      getSafeRoute();
    }
  }, [destination, map, currentUserLocation, avoidPolygons]);

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
      </div>

      <GoogleMap
        onLoad={onMapLoad}
        center={center}
        zoom={15}
        mapContainerStyle={{ width: "100%", height: "100%" }}
      >
        {/* Render LANDSAT data markers */}
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

        {/* Render fire polygons */}
        {firePolygons.map((poly, idx) => (
          <Polygon
            key={idx}
            paths={poly.map(([lng, lat]) => ({ lat, lng }))}
            options={{
              fillColor: "red",
              fillOpacity: 0.35,
              strokeColor: "red",
              strokeOpacity: 0.8,
              strokeWeight: 2,
            }}
          />
        ))}

        {/* Render destination pins for every amenity */}
        {recommendations &&
          recommendations.map((place, idx) => {
            const lat = place.geometry.location.lat;
            const lng = place.geometry.location.lng;
            return (
              <Marker
                key={`amenity-${idx}`}
                position={{ lat, lng }}
                icon={{
                  url: "/pngegg (1).png",
                  scaledSize: new window.google.maps.Size(30, 30),
                }}
              />
            );
          })}
      </GoogleMap>
    </div>
  );
}
