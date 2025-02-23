"use client";

import { useState, useEffect } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { useAuth } from '@/context/AuthContext';
import { firestoreService } from '@/firebase/services/firestore';
import { useRouter } from 'next/navigation';

export default function AddressPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [address, setAddress] = useState('');
  // Default to College of Wooster (ensure correct longitude sign if needed)
  const [location, setLocation] = useState({ lat: 40.8117, lng: -81.9308 });

  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
        },
        () => {
          alert('Unable to retrieve your location');
          setLocation({ lat: 40.8117, lng: -81.9308 });
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
      setLocation({ lat: 40.8117, lng: -81.9308 });
    }
  }, []);

  // Reverse geocode the current location to autofill the address once the API is loaded
  useEffect(() => {
    if (isLoaded && location && address === '') {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setAddress(results[0].formatted_address);
        } else {
          alert('Geocode was not successful for the following reason: ' + status);
        }
      });
    }
  }, [isLoaded, location, address]);

  const handleAddressChange = (event) => {
    setAddress(event.target.value);
  };

  // Trigger geocoding when the user presses Enter in the address input field
  const handleApply = () => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const { lat, lng } = results[0].geometry.location;
        setLocation({ lat: lat(), lng: lng() });
      } else {
        alert('Geocode was not successful for the following reason: ' + status);
      }
    });
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });

          const geocoder = new window.google.maps.Geocoder();
          const latlng = { lat: latitude, lng: longitude };
          geocoder.geocode(
