// InfoCard.jsx
import React, { useState, useEffect } from "react";
import InfoPopup from "./infoPopup";
import { fetchRouteInfo } from "@/utils/fetchRouteInfo";

const InfoCard = ({ place, userLocation, geminiExplanation, user }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [routeInfo, setRouteInfo] = useState({ eta: null, distance: null });

  useEffect(() => {
    const getRouteDetails = async () => {
      try {
        const data = await fetchRouteInfo(
          { lat: userLocation.lat, lng: userLocation.lng },
          { lat: place.geometry.location.lat, lng: place.geometry.location.lng },
          null, // No safe waypoint provided
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
          backgroundColor: "#fff",
          borderRadius: "8px",
          padding: "15px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          cursor: "pointer",
          position: "relative",
          transition: "transform 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            backgroundColor: "#007BFF",
            color: "#fff",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
          }}
        >
          {place.types && place.types[0]}
        </div>
        <h3 style={{ margin: "10px 0", fontSize: "18px" }}>{place.name}</h3>
        <p style={{ fontSize: "14px", color: "#555", margin: "5px 0" }}>
          {routeInfo.distance 
            ? `${(routeInfo.distance / 1609.34).toFixed(2)} miles away`
            : "Calculating distance..."}
        </p>
        <p style={{ fontSize: "14px", color: "#555", margin: "5px 0" }}>
          {routeInfo.eta 
            ? `ETA: ${routeInfo.eta} minutes`
            : "Calculating ETA..."}
        </p>
        <p style={{ fontSize: "12px", color: "#777", marginTop: "10px" }}>
          {place.vicinity}
        </p>
      </div>
      {showPopup && (
        <InfoPopup
          place={place}
          geminiExplanation={geminiExplanation}
          onClose={() => setShowPopup(false)}
        />
      )}
    </>
  );
};

export default InfoCard;
