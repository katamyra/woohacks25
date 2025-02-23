import React, { useState, useEffect } from "react";
import InfoPopup from "./infoPopup";
import { fetchRouteInfo } from "@/utils/fetchRouteInfo";

const InfoCard = ({
  place,
  userLocation,
  geminiExplanation,
  user,
  onSetDestination,
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const [routeInfo, setRouteInfo] = useState({ eta: null, distance: null });

  useEffect(() => {
    const getRouteDetails = async () => {
      try {
        const data = await fetchRouteInfo(
          { lat: userLocation.lat, lng: userLocation.lng },
          {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
          },
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
          padding: "8px",
          cursor: "pointer",
          position: "relative",
          height: "150px", // Fixed height for grid layout consistency
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
            fontSize: "12px",
          }}
        >
          {place.types && place.types[0]}
        </div>

        <h3 style={{ margin: "0.3rem 0", fontSize: "1rem" }}>
          {place.name}
        </h3>
        <p style={{ fontSize: "10px", color: "#555" }}>
          {routeInfo.distance
            ? `${(routeInfo.distance / 1609.34).toFixed(1)} miles away`
            : "Calculating distance..."}
          {" • "}
          {place.vicinity}
        </p>
        <p style={{ fontSize: "10px", color: "#555" }}>
          {routeInfo.eta
            ? (() => {
                const etaMinutes = Math.round(parseInt(routeInfo.eta) / 60);
                return `ETA: ${etaMinutes} minutes`;
              })()
            : `ETA: ${Math.round(place.dummyETA)} minutes`}
          {" • "}
          Walkability:{" "}
          {
            // If walkability is null, show "Loading...", if 0 then "N/A", otherwise display the value rounded to two decimals.
            place.walkability === null
              ? "Loading..."
              : place.walkability === 0
              ? "N/A"
              : place.walkability.toFixed(2)
          }
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
