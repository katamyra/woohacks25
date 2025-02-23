"use client";
import React, { useState, useEffect } from "react";
import MapOverlay from "./map_overlay";
import Gallery from "./gallery";
import { useAuth } from "@/context/AuthContext";
import { firestoreService } from "@/firebase/services/firestore";
import { fetchRecommendations } from "@/utils/fetchRecommendations";
import axios from "axios";

const RecommendationsPage = () => {
  const [galleryExpanded, setGalleryExpanded] = useState(false);
  const [review, setReview] = useState("");
  const [address, setAddress] = useState("");
  const [lng, setLng] = useState(0);
  const [lat, setLat] = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  const [landsatData, setLandsatData] = useState([]);
  const { user, loading } = useAuth();

  const [geminiExplanations, setGeminiExplanations] = useState({});
  const [destination, setDestination] = useState(null);

  // Firestore fetch 
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userData = await firestoreService.getUserData(user.uid);
          console.log("User Data:", userData);
          setReview(userData.review);
          setAddress(userData.address.formatted);
          setLng(userData.address.coordinates.lng);
          setLat(userData.address.coordinates.lat);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };
    fetchUserData();
  }, [user]);

  // Fetch data needed for recommendations
  useEffect(() => {
    const fetchInitialRecommendations = async () => {
      if (review && address && lng && lat) {
        try {
          const data = await fetchRecommendations(review, { address, lng, lat });
          setRecommendations(data);
        } catch (error) {
          console.error("Error fetching recommendations:", error);
        }
      }
    };
    fetchInitialRecommendations();
  }, [review, address, lng, lat]);

  useEffect(() => {
    const fetchExplanations = async () => {
      if (recommendations.length > 0) {
        try {
          const explanations = {};
          for (const place of recommendations) {
            const response = await axios.post("/api/generate-explanations", {
              review,
              place,
            });
            explanations[place.place_id] = response.data.explanation;
          }
          setGeminiExplanations(explanations);
        } catch (error) {
          console.error("Error fetching Gemini explanations:", error);
        }
      }
    };
    fetchExplanations();
  }, [recommendations, review]);

  // Helper functions to calculate distance
  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  // Define the "altnata" location as Atlanta's coordinates
  const targetLat = 33.7490;
  const targetLng = -84.3880;
  const thresholdDistanceKm = 50;
  useEffect(() => {
    const fetchLandsatData = async () => {
      try {
        const response = await axios.get("/api/landsat"); // API route
        const data = response.data.data.map((item) => ({
          lat: parseFloat(item.latitude),
          lng: parseFloat(item.longitude),
          confidence: item.confidence,
          acq_date: item.acq_date,
          acq_time: item.acq_time,
          daynight: item.daynight,
          satellite: item.satellite,
        }));

        // Filter the data to include only points near "altnata"
        const filteredData = data.filter((item) => {
          const distance = getDistanceFromLatLonInKm(
            item.lat,
            item.lng,
            targetLat,
            targetLng
          );
          return distance < thresholdDistanceKm;
        });

        setLandsatData(filteredData);
        console.log("Filtered Landsat Data:", filteredData);
      } catch (error) {
        console.error("Error fetching LANDSAT data:", error);
      }
    };

    fetchLandsatData();
  }, []);

  const toggleGallery = () => setGalleryExpanded(!galleryExpanded);

  const containerStyle = {
    display: "flex",
    height: "100vh",
    width: "100vw",
    margin: 0,
    padding: 0,
  };

  const galleryStyle = {
    flex: galleryExpanded ? 1 : 0.3,
    backgroundColor: "#000",
    color: "#fff",
    padding: "20px",
    overflowY: "auto",
    transition: "flex 0.3s ease",
    display: "flex",
    flexDirection: "column",
  };

  const mapStyle = {
    flex: 0.7,
    transition: "flex 0.3s ease",
    display: "flex",
    flexDirection: "column",
  };

  return (
    <div style={containerStyle}>
      <div style={galleryStyle} className="bg-gray-800">
        <button
          onClick={toggleGallery}
          style={{
            marginBottom: "10px",
            backgroundColor: "#444",
            color: "#fff",
            border: "none",
            padding: "10px",
          }}
        >
          {galleryExpanded ? "Collapse Gallery" : "Expand Gallery"}
        </button>

        <h2>Recommended Locations</h2>
        {/* Render the Gallery component */}
        <Gallery
          recommendations={recommendations}
          userLocation={{ lat, lng }}
          geminiExplanations={geminiExplanations}
          user={user}
          onSetDestination={setDestination}
        />
      </div>

      {!galleryExpanded && (
        <div style={mapStyle}>
          <MapOverlay
            landsatData={landsatData}
            userLocation={{ lat, lng }}
            destination={destination}
          />
        </div>
      )}
    </div>
  );
};

export default RecommendationsPage;
