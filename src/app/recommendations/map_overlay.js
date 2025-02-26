"use client";
import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Polygon,
  Marker,
  DirectionsRenderer,
} from "@react-google-maps/api";
import * as turf from "@turf/turf";
import CustomMarker from "./CustomMarker";
import { useAuth } from "@/context/AuthContext";
import { fetchSafeRouteORS } from "@/utils/fetchSafeRouteORS";
import { decodeORSGeometry } from "@/utils/decodeORSGeometry";
import { useSelector } from "react-redux";
import { getDemoFirePolygon } from "@/utils/demoFire";
import { DEMO_USER_COORDS } from "@/utils/demoFire";
import dynamic from "next/dynamic";
import InfoPopup from "./infoPopup";

// Helper function for comparing coordinates
function areCoordinatesEqual(coord1, coord2) {
  if (!coord1 || !coord2) return false;
  return (
    Number(coord1.lat) === Number(coord2.lat) &&
    Number(coord1.lng) === Number(coord2.lng)
  );
}

// Helper function to decide colors for block group polygons based on PEI score
function getColor(value) {
  const score = Math.max(0, Math.min(1, value));
  if (score > 0.95) return "#006400";
  if (score > 0.9) return "#228B22";
  if (score > 0.85) return "#32CD32";
  if (score > 0.8) return "#7FFF00";
  if (score > 0.7) return "#ADFF2F";
  if (score > 0.6) return "#FFFF66";
  if (score > 0.5) return "#FFFF00";
  if (score > 0.4) return "#FFD700";
  if (score > 0.3) return "#FFA500";
  if (score > 0.2) return "#FF4500";
  if (score > 0.1) return "#B22222";
  return "#8B0000";
}

export default function MapOverlay({
  landsatData,
  recommendations,
  onSetDestination,
  geminiExplanations,
}) {
  if (typeof window === "undefined") {
    return null;
  }

  // Load the Google Map
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  });

  // Declare states
  const [map, setMap] = useState(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [hoverScore, setHoverScore] = useState(null);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [currentUserLocation, setCurrentUserLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const [selectedAmenity, setSelectedAmenity] = useState(null);

  // Refs for route data layer, previous destination, and auto‑zoom flag
  const routeDataLayerRef = useRef(null);
  const prevDestinationRef = useRef(null);
  const hasAutoZoomed = useRef(false);

  // Get the selected destination coordinates from Redux
  const selectedDestinationCoord = useSelector(
    (state) => state.destination.destination
  );

  // Reset the auto‑zoom/center flag when destination coordinates change
  useEffect(() => {
    if (selectedDestinationCoord) {
      if (
        !areCoordinatesEqual(
          selectedDestinationCoord,
          prevDestinationRef.current
        )
      ) {
        hasAutoZoomed.current = false;
        prevDestinationRef.current = selectedDestinationCoord;
      }
    }
  }, [selectedDestinationCoord]);

  // Fetch the input location from localStorage
  useEffect(() => {
    const storedUserData = localStorage.getItem("userData");
    const useDemo = localStorage.getItem("useDemoFire") === "true";
    if (storedUserData) {
      const parsedData = JSON.parse(storedUserData);
      if (parsedData.address && parsedData.address.coordinates) {
        setCurrentUserLocation(useDemo ? DEMO_USER_COORDS : parsedData.address.coordinates);
      } else {
        console.error(
          "No address coordinates found in stored userData. Using Wooster default location."
        );
        setCurrentUserLocation({ lat: 40.8117, lng: -81.9308 });
      }
    } else {
      console.error("No userData in localStorage. Using default Wooster location.");
      setCurrentUserLocation({ lat: 40.8117, lng: -81.9308 });
    }
  }, []);

  // Load map – set map instance, create data layer
  const onMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
    mapInstance.data.setMap(null);
    if (window.google) {
      const dataLayer = new window.google.maps.Data({ map: mapInstance });
      routeDataLayerRef.current = dataLayer;
    }
  }, []);

  // Log Landsat Data whenever it changes
  useEffect(() => {
    console.log("Landsat Data:", landsatData);
  }, [landsatData]);

  // Mouse listeners to display PEI score
  useEffect(() => {
    if (map && window.google) {
      map.data.addListener("mouseover", (e) => {
        const score = e.feature.getProperty("PEI_score");
        setHoverScore(
          score !== undefined && score !== null ? parseFloat(score) : null
        );
      });
      map.data.addListener("mouseout", () => setHoverScore(null));
    }
  }, [map]);

  // Center the map based on Landsat data OR current user location
  const center = useMemo(() => {
    if (landsatData && landsatData.length > 0) {
      let sumLat = 0,
        sumLng = 0;
      landsatData.forEach((point) => {
        sumLat += parseFloat(point.lat);
        sumLng += parseFloat(point.lng);
      });
      return {
        lat: sumLat / landsatData.length,
        lng: sumLng / landsatData.length,
      };
    } else if (currentUserLocation) {
      return currentUserLocation;
    } else {
      return { lat: 40.8117, lng: -81.9308 };
    }
  }, [landsatData, currentUserLocation]);

  // Fit the map bounds to the Landsat data points
  useEffect(() => {
    if (map && landsatData && landsatData.length > 0 && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      landsatData.forEach((point) => {
        bounds.extend(
          new window.google.maps.LatLng(
            parseFloat(point.lat),
            parseFloat(point.lng)
          )
        );
      });
      map.fitBounds(bounds);
    }
  }, [map, landsatData]);

  // Build fire polygons with 1km radius
  const landFirePolygons = useMemo(() => {
    return landsatData.map((dataPoint) => {
      const point = turf.point([dataPoint.lng, dataPoint.lat]);
      const polygon = turf.buffer(point, 1, { units: "kilometers" });
      return { coordinates: polygon.geometry.coordinates, isDemo: false };
    });
  }, [landsatData]);

  // Build demo fire polygon
  const demoFirePolygon = useMemo(() => {
    return { coordinates: getDemoFirePolygon(), isDemo: true };
  }, []);

  // Read demo flag from localstorage
  const useDemoFire =
    typeof window !== "undefined" &&
    localStorage.getItem("useDemoFire") === "true";

  // Merge red fires and blue demo fire polygons
  const allFirePolygons = useMemo(() => {
    if (useDemoFire) {
      return [...landFirePolygons, demoFirePolygon];
    } else {
      return [...landFirePolygons];
    }
  }, [landFirePolygons, demoFirePolygon, useDemoFire]);

  // Get fire polygon coords
  const safeFirePolygons = useMemo(() => {
    return allFirePolygons.map((poly) => poly.coordinates);
  }, [allFirePolygons]);

  // Construct GEOJSON from all fire polygons (if demo flag==True, include demo fire polygon)
  const avoidPolygons = useMemo(
    () => ({
      type: "MultiPolygon",
      coordinates: allFirePolygons.map((p) => p.coordinates),
    }),
    [allFirePolygons]
  );

  // Store avoidPolygons in localStorage
  useEffect(() => {
    if (avoidPolygons) {
      localStorage.setItem("avoidPolygons", JSON.stringify(avoidPolygons));
    }
  }, [avoidPolygons]);

  // Auto‑zoom and center the map (runs once per new destination)
  const autoZoomAndCenter = useCallback(() => {
    if (hasAutoZoomed.current) return;
    if (
      map &&
      currentUserLocation &&
      selectedDestinationCoord &&
      window.google
    ) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(
        new window.google.maps.LatLng(
          currentUserLocation.lat,
          currentUserLocation.lng
        )
      );
      bounds.extend(
        new window.google.maps.LatLng(
          selectedDestinationCoord.lat,
          selectedDestinationCoord.lng
        )
      );
      map.fitBounds(bounds);
      hasAutoZoomed.current = true;
    }
  }, [map, currentUserLocation, selectedDestinationCoord]);

  // Fetch safe route data via ORS API using safeFirePolygons
  useEffect(() => {
    if (
      selectedDestinationCoord &&
      map &&
      window.google &&
      currentUserLocation &&
      routeDataLayerRef.current
    ) {
      const getSafeRoute = async () => {
        try {
          console.log("🚀 Starting safe route calculation...");
          console.log("📍 From:", currentUserLocation);
          console.log("🎯 To:", selectedDestinationCoord);
          console.log("🔥 Fire polygons:", safeFirePolygons?.length || 0);

          const routeData = await fetchSafeRouteORS(
            currentUserLocation,
            selectedDestinationCoord,
            safeFirePolygons
          );

          console.log("✅ Route calculated successfully:", {
            distance: routeData?.distance,
            duration: routeData?.duration,
            points: routeData?.geometry?.length || 0,
          });

          setRouteInfo(routeData);
          if (routeData.geometry) {
            const pathCoordinates = decodeORSGeometry(routeData.geometry);
            const geoJsonRoute = {
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: pathCoordinates.map((coord) => [
                  coord.lng,
                  coord.lat,
                ]),
              },
              properties: {},
            };

            routeDataLayerRef.current.forEach((feature) =>
              routeDataLayerRef.current.remove(feature)
            );
            routeDataLayerRef.current.addGeoJson(geoJsonRoute);
            routeDataLayerRef.current.setStyle({
              strokeColor: "#4285F4",
              strokeWeight: 4,
            });
            autoZoomAndCenter();
          }
        } catch (error) {
          console.error("❌ Safe route calculation failed:", {
            error: error.message,
            details: error.response?.data,
            coordinates: {
              from: currentUserLocation,
              to: selectedDestinationCoord,
            },
          });
        }
      };
      getSafeRoute();
    }
  }, [
    selectedDestinationCoord,
    map,
    currentUserLocation,
    autoZoomAndCenter,
    safeFirePolygons,
  ]);

  // Clear route from data layer when no destination is selected
  useEffect(() => {
    if (!selectedDestinationCoord && routeDataLayerRef.current) {
      routeDataLayerRef.current.forEach((feature) =>
        routeDataLayerRef.current.remove(feature)
      );
    }
  }, [selectedDestinationCoord]);

  // Toggle GEOJSON display on map (for walkability overlay)
  const toggleGeoJson = async () => {
    if (!map) return;
    if (overlayVisible) {
      map.data.setMap(null);
      setOverlayVisible(false);
      return;
    }
    try {
      const csvUrl =
        "https://storage.googleapis.com/woohack25/atlanta_blockgroup_PEI_2022.csv?cachebust=1";
      const geoJsonUrl =
        "https://storage.googleapis.com/woohack25/atlanta_blockgroup_PEI_2022.geojson?cachebust=1";

      const fetchCsvAndParse = async (url) => {
        const response = await fetch(url);
        if (!response.ok)
          throw new Error(`CSV fetch failed: ${response.status}`);
        const text = await response.text();
        const lines = text.split(/\r?\n/);
        if (lines.length === 0) return {};
        const header = lines[0].split(",");
        const geoidIndex = header.indexOf("GEOID");
        const peiIndex = header.indexOf("PEI");
        const scoreMap = {};
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].trim();
          if (!row) continue;
          const cols = row.split(",");
          const geoid = cols[geoidIndex];
          const pei = parseFloat(cols[peiIndex]);
          if (geoid && !isNaN(pei)) scoreMap[geoid] = pei;
        }
        return scoreMap;
      };

      const scoreMap = await fetchCsvAndParse(csvUrl);
      const geoRes = await fetch(geoJsonUrl);
      if (!geoRes.ok) throw new Error(`GeoJSON fetch failed: ${geoRes.status}`);
      const geojson = await geoRes.json();

      const mergePEIScoreIntoGeojson = (geojson, scoreMap) => {
        if (!geojson.features) return geojson;
        geojson.features.forEach((feature) => {
          const geoid = feature.properties?.GEOID;
          if (geoid && scoreMap[geoid] !== undefined) {
            feature.properties.PEI_score = scoreMap[geoid];
          }
        });
        return geojson;
      };

      mergePEIScoreIntoGeojson(geojson, scoreMap);

      map.data.forEach((f) => map.data.remove(f));
      map.data.addGeoJson(geojson);
      map.data.setStyle((feature) => {
        const score = feature.getProperty("PEI_score") || 0.0;
        return {
          fillColor: getColor(score),
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

  // Common styles for UI controls
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
      {/* UI controls for toggling the GEOJSON overlay */}
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
      {/* Render the Google Map */}
      {!isLoaded ? (
        <div>Loading Map...</div>
      ) : (
        <GoogleMap
          onLoad={onMapLoad}
          center={center}
          zoom={17.2}
          mapContainerStyle={{ width: "100%", height: "94.9%" }}
        >
          {/* Render markers for Landsat fires */}
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
          {/* Render polygons for each fire area */}
          {allFirePolygons.map((item, idx) => (
            <Polygon
              key={idx}
              paths={item.coordinates[0].map(([lng, lat]) => ({ lat, lng }))}
              options={{
                fillColor: item.isDemo ? "blue" : "red",
                fillOpacity: 0.35,
                strokeColor: item.isDemo ? "blue" : "red",
                strokeOpacity: 0.8,
                strokeWeight: 2,
              }}
            />
          ))}
          {/* Render markers for amenities */}
          {recommendations &&
            recommendations.map((place, idx) => {
              const lat = place.geometry.location.lat;
              const lng = place.geometry.location.lng;
              console.log("Amenity latitude:", lat);
              console.log("Amenity longitude:", lng);
              return (
                <Marker
                  key={`amenity-${idx}`}
                  position={{ lat, lng }}
                  icon={{
                    url: "/pin.png",
                    scaledSize: new window.google.maps.Size(30, 30),
                  }}
                  onClick={() => setSelectedAmenity(place)}
                />
              );
            })}
          {/* Render marker for current user location */}
          {currentUserLocation && (
            <Marker
              position={currentUserLocation}
              icon={{
                url: "https://maps.google.com/mapfiles/kml/shapes/man.png",
                scaledSize: new window.google.maps.Size(40, 40),
              }}
            />
          )}
          {/* Render marker for the destination */}
          {selectedDestinationCoord && (
            <Marker
              position={selectedDestinationCoord}
              label="Destination"
              icon={{
                url: "/destination.png",
                scaledSize: new window.google.maps.Size(30, 30),
              }}
            />
          )}
          {/* Render driving directions if available */}
          {directions && <DirectionsRenderer directions={directions} />}
        </GoogleMap>
      )}
      {/* Display popup when amenity is selected */}
      {selectedAmenity && (
        <InfoPopup
          place={selectedAmenity}
          geminiExplanation={
            geminiExplanations && geminiExplanations[selectedAmenity.place_id]
          }
          onClose={() => setSelectedAmenity(null)}
          onSetDestination={onSetDestination}
        />
      )}
    </div>
  );
}
