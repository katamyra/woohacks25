"use client";
import React, { useState, useEffect } from "react";
import InfoPopup from "./infoPopup";
import { fetchRouteInfo } from "@/utils/fetchRouteInfo";

const InfoCard = ({ place, userLocation, geminiExplanation, user, onSetDestination }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [routeInfo, setRouteInfo] = useState({ eta: null, distance: null });

  // Helper to get open/closed status
  const getLocationStatus = (place) => {
    if (place.opening_hours && typeof place.opening_hours.open_now === "boolean") {
      return place.opening_hours.open_now ? "Open" : "Closed";
    } else {
      return "Unknown";
    }
  };

  useEffect(() => {
    const getRouteDetails = async () => {
      try {
        const data = await fetchRouteInfo(
          { lat: userLocation.lat, lng: userLocation.lng },
          { lat: place.geometry.location.lat, lng: place.geometry.location.lng },
          null,
          user
        );
        setRouteInfo(data);
      } catch (error) {
        console.error("Error fetching route info:", error);
      }
    };

    getRouteDetails();
  }, [userLocation, place, user]);

  return (
    <>
      <div
        className="info-card"
        onClick={() => setShowPopup(true)}
        style={{
          border: "1px solid #444",
          borderRadius: "4px",
          padding: "8px",
          cursor: "pointer",
          position: "relative",
          height: "150px",
          backgroundColor: "#000"
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: "5px",
            right: "5px",
            backgroundColor: "#007BFF",
            color: "#fff",
            padding: "2px 6px",
            borderRadius: "3px",
            fontSize: "14px",
          }}
        >
          {place.types && place.types[0]}
        </div>

        <h3 style={{ margin: "0.3rem 0", fontSize: "1.14rem", color: "#fff" }}>
          {place.name}
        </h3>
        <p style={{ fontSize: "13px", color: "#fff" }}>
          {routeInfo.distance
            ? `${(routeInfo.distance / 1609.34).toFixed(1)} miles away`
            : "Calculating distance..."}
          {" • "}
          {place.vicinity}
        </p>
        <p style={{ fontSize: "13px", color: "#fff" }}>
          {routeInfo.eta
            ? (() => {
                const etaMinutes = Math.round(parseInt(routeInfo.eta) / 60);
                return `ETA: ${etaMinutes} minutes`;
              })()
            : `ETA: ${Math.round(place.dummyETA)} minutes`}
          {" • "}
          Walkability:{" "}
          {place.walkability === null
            ? "Loading..."
            : place.walkability === 0
            ? "N/A"
            : place.walkability.toFixed(2)}
        </p>
        <p style={{ fontSize: "13px", color: "#fff" }}>
          Status: {getLocationStatus(place)}
        </p>
      </div>

      {showPopup && (
        <InfoPopup
          place={place}
          geminiExplanation={geminiExplanation}
          onClose={() => setShowPopup(false)}
          onSetDestination={onSetDestination}
        />
      )}
    </>
  );
};

export default InfoCard;
