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
import {
  setDestination,
  clearDestination,
} from "../features/destination/destinationSlice";

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

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userData = await firestoreService.getUserData(user.uid);
          console.log("User Data:", userData);
          localStorage.setItem("userData", JSON.stringify(userData)); // Store the most updated userData in localStorage
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

  useEffect(() => {
    console.log("USER LOCATION", { lat, lng });
  }, [lat, lng]);

  // Fetch amenity recommendations
  useEffect(() => {
    const fetchInitialRecommendations = async () => {
      if (review && address && lng && lat) {
        try {
          const data = await fetchRecommendations(review, {
            address,
            lng,
            lat,
          });
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

  // Landsat data 340 miles within user coords
  const thresholdDistanceKm = 250 * 1.609344; // km to miles
  useEffect(() => {
    // Fetch landsat data if valid coords exist
    if (!lat || !lng) return;
    const fetchLandsatData = async () => {
      try {
        const response = await axios.get("/api/landsat"); // NASA Landsat API route
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
          const distance = getDistanceFromLatLonInKm(
            item.lat,
            item.lng,
            lat,
            lng
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
  }, [lat, lng]);

  const toggleGallery = () => setGalleryExpanded(!galleryExpanded);

  return (
    <div className="flex flex-col md:flex-row h-screen m-0 p-0 overflow-x-hidden">
      <div
        className={`flex-1 ${
          galleryExpanded ? "w-full" : "md:flex-[0.3]"
        } h-[95vh] bg-black text-white p-4 overflow-y-auto transition-all duration-300 flex flex-col`}
      >
        <button
          onClick={toggleGallery}
          className="mb-2 bg-gray-600 text-white border-none py-2 px-4"
        >
          {galleryExpanded ? "Collapse Gallery" : "Expand Gallery"}
        </button>

        <h2 className="text-xl mb-4">Recommended Locations</h2>
        <Gallery
          recommendations={recommendations}
          userLocation={{ lat, lng }}
          geminiExplanations={geminiExplanations}
          user={user}
          galleryExpanded={galleryExpanded}
          onSetDestination={updateDestination}
        />
      </div>

      {!galleryExpanded && (
        <div className="flex-1 md:flex-[0.69] transition-all duration-300 flex flex-col">
          <MapOverlayNoSSR
            landsatData={landsatData}
            recommendations={recommendations}
            userLocation={{ lat, lng }}
            destination={destination}
            onSetDestination={updateDestination}
            geminiExplanations={geminiExplanations}
          />
        </div>
      )}
    </div>
  );
};

export default RecommendationsPage;
