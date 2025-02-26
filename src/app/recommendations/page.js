"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Gallery from "./gallery";
import { useAuth } from "@/context/AuthContext";
import { firestoreService } from "@/firebase/services/firestore";
import { fetchRecommendations } from "@/utils/fetchRecommendations";
import axios from "axios";

// Import Redux hooks and destination actions
import { useDispatch } from "react-redux";
import { setDestination, clearDestination } from "../features/destination/destinationSlice";

// Import map overlay with SSR disabled
const MapOverlayNoSSR = dynamic(() => import("./map_overlay"), { ssr: false });

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
  const [destination, setDestinationState] = useState(null);
  const [targetLat, setTargetLat] = useState(33.7756);
  const [targetLng, setTargetLng] = useState(-84.3963);
  
  const dispatch = useDispatch();

  // Helper function: update both localStorage and Redux state
  const updateDestination = (newDestination) => {
    if (newDestination) {
      localStorage.setItem("destinationCoord", JSON.stringify(newDestination));
      dispatch(setDestination(newDestination));
      setDestinationState(newDestination);
    } else {
      localStorage.removeItem("destinationCoord");
      dispatch(clearDestination());
      setDestinationState(null);
    }
  };

  // set the target location according to the user's address
  useEffect(() => {
    const storedData = localStorage.getItem("userData");
    if (storedData) {
      try {
        const userData = JSON.parse(storedData);
        if (userData?.address?.coordinates) {
          setTargetLat(userData.address.coordinates.lat);
          setTargetLng(userData.address.coordinates.lng);
        }
      } catch (error) {
        console.error("Error parsing userData from localStorage:", error);
      }
    }
  }, []); 

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userData = await firestoreService.getUserData(user.uid);
          console.log("User Data:", userData);
          localStorage.setItem("userData", JSON.stringify(userData)); // most updated userData stored in localStorage
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

  // Fetch amenity recommendations
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

  // Fetch Gemini AI amenity explanations
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

  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Define a target location (user's location)
  const thresholdDistanceKm = 50 * 1.60934; // Convert to miles
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

        const filteredData = data.filter((item) => {
          const distance = getDistanceFromLatLonInKm(item.lat, item.lng, targetLat, targetLng);
          return distance < thresholdDistanceKm;
        });

        setLandsatData(filteredData);
        console.log("Filtered Landsat Data:", filteredData);
      } catch (error) {
        console.error("Error fetching LANDSAT data:", error);
      }
    };

    fetchLandsatData();
  }, [targetLat, targetLng]);

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
    WebkitOverflowScrolling: "touch",
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
    <div className="flex flex-col md:flex-row min-h-screen w-screen overflow-auto">
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
        <Gallery
          recommendations={recommendations}
          userLocation={{ lat, lng }}
          geminiExplanations={geminiExplanations}
          user={user}
          galleryExpanded={galleryExpanded}
          onSetDestination={updateDestination}  // Pass helper function
        />
      </div>

      {!galleryExpanded && (
        <div style={mapStyle}>
          {/* Use the dynamically imported MapOverlay with SSR disabled */}
          <MapOverlayNoSSR
            landsatData={landsatData}
            recommendations={recommendations}
            userLocation={{ lat, lng }}
            destination={destination}
          />
        </div>
      )}
    </div>
  );
};

export default RecommendationsPage;
