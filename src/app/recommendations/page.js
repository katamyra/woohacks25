"use client";
import React, { useState, useEffect } from "react";
import MapOverlay from "./map_overlay";
import Gallery from "./gallery";
import { useAuth } from '@/context/AuthContext';
import { firestoreService } from '@/firebase/services/firestore';
import { fetchRecommendations } from '@/utils/fetchRecommendations';
import axios from 'axios';

const RecommendationsPage = () => {
  const [galleryExpanded, setGalleryExpanded] = useState(false);
  const [review, setReview] = useState('');
  const [address, setAddress] = useState('');
  const [lng, setLng] = useState(0);
  const [lat, setLat] = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  const [landsatData, setLandsatData] = useState([]);
  const { user, loading } = useAuth();

  const [geminiExplanations, setGeminiExplanations] = useState({});

  // Firestore fetch 
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userData = await firestoreService.getUserData(user.uid);
          console.log('User Data:', userData);
          setReview(userData.review);
          setAddress(userData.address.formatted);
          setLng(userData.address.coordinates.lng);
          setLat(userData.address.coordinates.lat);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };
    fetchUserData();
  }, [user]);

  // Fetch Data needed for reccomendations
  useEffect(() => {
    const fetchInitialRecommendations = async () => {
      if (review && address && lng && lat) {
        try {
          const data = await fetchRecommendations(review, { address, lng, lat });
          setRecommendations(data);
        } catch (error) {
          console.error('Error fetching recommendations:', error);
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

  // Fetch LANDSAT data
  useEffect(() => {
    const fetchLandsatData = async () => {
      try {
        const response = await axios.get('/api/landsat'); // API route
        const data = response.data.data.map(item => ({
          lat: parseFloat(item.latitude), // Convert latitude to number
          lng: parseFloat(item.longitude), // Convert longitude to number
          confidence: item.confidence, // Keep confidence as is
          acq_date: item.acq_date, // Optional: keep other properties if needed
          acq_time: item.acq_time,
          daynight: item.daynight,
          satellite: item.satellite,
          // Add any other properties you want to keep
        }));
        setLandsatData(data); // Store LANDSAT data
        console.log('Landsat Data:', data); // Log the data
      } catch (error) {
        console.error('Error fetching LANDSAT data:', error);
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
      <div style={galleryStyle}>
        <button
          onClick={toggleGallery}
          style={{
            marginBottom: "10px",
            backgroundColor: "#444",
            color: "#fff",
            border: "none",
            padding: "10px"
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
        />
      </div>

      {!galleryExpanded && (
        <div style={mapStyle}>
          <MapOverlay 
            landsatData={landsatData} 
            recommendations={recommendations} 
          />
        </div>
      )}
    </div>
  );
};

export default RecommendationsPage;