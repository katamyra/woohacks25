import React, { useState, useEffect } from "react";
import { fetchSafeRouteORS } from "@/utils/fetchSafeRouteORS";
import { useAuth } from '@/context/AuthContext';
import { useSelector, useDispatch } from 'react-redux';
import { addCoordinate, resetCoordinates } from '../features/coordinates/coordinatesSlice';
import { setDestination } from '../features/destination/destinationSlice';
const InfoPopup = ({ place, geminiExplanation, onClose }) => {
  const { user, loading } = useAuth();
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const lat = place.geometry.location.lat;
  const lng = place.geometry.location.lng;
  const destinationCoord = {lat, lng};
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userData = await firestoreService.getUserData(user.uid);
          console.log("userLocation", userLocation);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };
    fetchUserData();
  }, [user]);

  useEffect(() => {
    console.log("Route Info", routeInfo);
  }, [routeInfo]);

  // Function to handle setting the safe route
  const handleSetSafeRoute = () => {
    dispatch(setDestination(destinationCoord));
    localStorage.setItem("destinationCoord", JSON.stringify(destinationCoord));
    const firePolygonsCollection = localStorage.getItem("avoidPolygons");
    fetchSafeRouteORS(userLocation, destinationCoord, firePolygonsCollection, userLocation)
      .then(result => {
        setRouteInfo(result);
      })
      .catch(error => {
        console.error('Error fetching safe route:', error);
      });
  };
  
  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        className="modal-content"
        style={{
          backgroundColor: "#fff",
          color: "#000",
          width: "90%",
          maxWidth: "400px",
          padding: "20px",
          position: "relative",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          overflow: "visible",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "15px",
            right: "15px",
            background: "transparent",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
            color: "#888",
          }}
        >
          &times;
        </button>

        {place.photos && place.photos[0] && (
          <img
            src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${place.photos[0].photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
            alt={place.name}
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "8px",
              display: "block",
              margin: "0 auto 20px auto",
              objectFit: "cover",
            }}
          />
        )}

        <h2 style={{ textAlign: "center", marginBottom: "10px", fontSize: "20px" }}>
          {place.name}
        </h2>
        <p style={{ fontSize: "14px", marginBottom: "8px" }}>
          <strong>Address:</strong> {place.vicinity}
        </p>
        <p style={{ fontSize: "14px", marginBottom: "8px" }}>
          <strong>Rating:</strong> {place.rating ? place.rating : "N/A"} / 5 (
          {place.user_ratings_total} reviews)
        </p>
        <p style={{ fontSize: "14px", marginBottom: "8px" }}>
          <strong>Price Level:</strong>{" "}
          {place.price_level ? "$".repeat(place.price_level) : "N/A"}
        </p>
        <p style={{ fontSize: "14px", marginBottom: "16px" }}>
          <strong>Description:</strong> This is a detailed description of the place.
          It might include additional information provided by Gemini AI.
        </p>

        <div
          style={{ display: "flex", alignItems: "center", position: "relative" }}
          onMouseEnter={() => setShowInfoTooltip(true)}
          onMouseLeave={() => setShowInfoTooltip(false)}
        >
          <span style={{ cursor: "help", fontSize: "20px", marginRight: "8px" }}>
            ℹ️
          </span>
          <span style={{ fontSize: "16px", fontWeight: "bold" }}>
            Why this place?
          </span>
          {showInfoTooltip && (
            <div
              style={{
                position: "absolute",
                top: "110%",
                left: "0",
                marginTop: "8px",
                padding: "10px",
                backgroundColor: "#333",
                color: "#fff",
                borderRadius: "6px",
                fontSize: "14px",
                whiteSpace: "pre-wrap",
                boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
                zIndex: 10,
                maxWidth: "250px",
              }}
            >
              {geminiExplanation || "No explanation available."}
            </div>
          )}
        </div>
        {/* Set Safe Route Button */}
        <button
          onClick={handleSetSafeRoute}
          style={{
            position: "absolute",
            bottom: "20px",
            right: "20px",
            padding: "10px 20px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            zIndex: 1000,
          }}
        >
          Set Safe Route
        </button>
      </div>
    </div>
  );
};

export default InfoPopup;
