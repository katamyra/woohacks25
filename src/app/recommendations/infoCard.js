import React, { useState, useEffect } from "react";
import InfoPopup from "./infoPopup";
import { fetchRouteInfo } from "@/utils/fetchRouteInfo";

const InfoCard = ({ place, userLocation, geminiExplanation, user, onSetDestination }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [routeInfo, setRouteInfo] = useState({ eta: null, distance: null });

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
          border: "1px solid #ccc",
          borderRadius: "4px",
          padding: "10px",
          marginBottom: "10px",
          cursor: "pointer",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "5px",
            right: "5px",
            backgroundColor: "#007BFF",
            color: "#fff",
            padding: "2px 6px",
            borderRadius: "3px",
            fontSize: "12px",
          }}
        >
          {place.types && place.types[0]}
        </div>

        <h3 style={{ marginTop: "0.5rem" }}>{place.name}</h3>
        <p style={{ fontSize: "12px", color: "#555" }}>
          {routeInfo.distance
            ? `${routeInfo.distance} miles away`
            : "Calculating distance..."}
          {" • "}
          {place.vicinity}
        </p>
        <p style={{ fontSize: "12px", color: "#555" }}>
          {routeInfo.eta
            ? `ETA: ${routeInfo.eta} minutes`
            : `ETA: ${place.dummyETA} minutes`}
          {" • "}
          Walkability: {place.walkability}
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
