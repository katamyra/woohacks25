"use client";
import React, { useState, useEffect } from "react";
import MapOverlay from "./map_overlay";
import { useAuth } from '@/context/AuthContext';
import { firestoreService } from '@/firebase/services/firestore';
import { fetchRecommendations } from '@/utils/fetchRecommendations';

const RecommendationsPage = () => {
  const [galleryExpanded, setGalleryExpanded] = useState(false);
  const [review, setReview] = useState('');
  const [address, setAddress] = useState('');
  const [lng, setLng] = useState(0);
  const [lat, setLat] = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  const { user, loading } = useAuth();

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

  useEffect(() => {
    const fetchInitialRecommendations = async () => {
      if (review && address && lng && lat) {
        try {
          const data = await fetchRecommendations(review, address, lng, lat);
          setRecommendations(data);
        } catch (error) {
          console.error('Error fetching recommendations:', error);
        }
      }
    };

    fetchInitialRecommendations();
  }, [review, address, lng, lat]);

  const toggleGallery = () => setGalleryExpanded(!galleryExpanded);

  // Main container
  const containerStyle = {
    display: "flex",
    height: "100vh",
    width: "100vw",
    margin: 0,
    padding: 0,
  };

  // Style the gallery section
  const galleryStyle = {
    flex: galleryExpanded ? 1 : 0.3,
    backgroundColor: "#000000",
    padding: "20px",
    overflowY: "auto",
    transition: "flex 0.3s ease",
    display: "flex",
    flexDirection: "column",
  };

  // Style the map section
  const mapStyle = {
    flex: 0.7,
    transition: "flex 0.3s ease",
    display: "flex",
    flexDirection: "column",
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl mb-8">Emergency Medical Recommendations</h1>
      <div style={containerStyle}>
        {/* Recommended gallery section */}
        <div style={galleryStyle}>
          <button onClick={toggleGallery} style={{ marginBottom: "10px" }}>
            {galleryExpanded ? "Collapse Gallery" : "Expand Gallery"}
          </button>
          <h2>Recommended Locations</h2>
          <div>
            {recommendations.length > 0 ? (
              recommendations.map((place, index) => (
                <p key={index}>{place.place} - Lat: {place.lat}, Lng: {place.lng}</p>
              ))
            ) : (
              <p>No recommendations available yet.</p>
            )}
          </div>
        </div>

        {/* Map section */}
        {!galleryExpanded && (
          <div style={mapStyle}>
            <MapOverlay />
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationsPage;