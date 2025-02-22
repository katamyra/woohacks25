"use client"
import { useState } from 'react';
import { Button, TextField, Typography, Box, Paper } from '@mui/material';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

export default function AddressPage() {
    const [address, setAddress] = useState('');
    const [location, setLocation] = useState({ lat: 37.7749, lng: -122.4194 }); // Default to San Francisco

    const handleAddressChange = (event) => {
        setAddress(event.target.value);
    };

    const handleApply = async () => {
        // Geocode the address to get latitude and longitude
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

    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            <Paper elevation={3} sx={{ width: '30%', padding: 3, boxSizing: 'border-box' }}>
                <Typography variant="h4" component="h2" gutterBottom>
                    Enter Address
                </Typography>
                <TextField
                    label="Address"
                    variant="outlined"
                    fullWidth
                    value={address}
                    onChange={handleAddressChange}
                    InputProps={{
                        style: { color: 'black' }, // Keep text color black
                    }}
                    sx={{ marginBottom: 2 }}
                />
                <Button variant="contained" color="primary" onClick={handleApply}>
                    Apply
                </Button>
            </Paper>
            <Box sx={{ flexGrow: 1, borderRadius: 2, overflow: 'hidden' }}>
                <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
                    <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={location}
                        zoom={14}
                    >
                        <Marker position={location} />
                    </GoogleMap>
                </LoadScript>
            </Box>
        </Box>
    );
}