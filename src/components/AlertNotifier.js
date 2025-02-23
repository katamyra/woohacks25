'use client';
import { useState, useEffect } from 'react';

export default function AlertNotifier() {
  const [showAlert, setShowAlert] = useState(false);
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  
  const messages = [
    "Severe weather alert in your area!. Please evacuate immediately.",
    "Emergency shelter opened nearby. Check map for location.", 
    "Power outage reported in your neighborhood. Prepare accordingly."
  ];

  useEffect(() => {
    // Initial delay before first alert
    const initialDelay = setTimeout(() => {
      setShowAlert(true);
    }, 120000);

    // Subsequent alerts every 2 minutes
    const interval = setInterval(() => {
      setCurrentAlertIndex(prev => (prev + 1) % messages.length);
      setShowAlert(true);
    }, 120000); // 2 minutes

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, []);

  if (!showAlert) return null;

  return (
    <div className="fixed top-4 right-4 w-80 z-50 animate-slide-in">
      <div role="alert" className="alert shadow-lg bg-base-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="stroke-info h-6 w-6 shrink-0">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <span>{messages[currentAlertIndex]}</span>
        <button 
          className="btn btn-sm btn-ghost"
          onClick={() => setShowAlert(false)}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </button>
      </div>
    </div>
  );
}