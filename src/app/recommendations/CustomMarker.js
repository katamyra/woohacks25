import React, { useState, useEffect } from "react";
import { OverlayView } from "@react-google-maps/api";

// Reuse the getOpacity function
const getOpacity = (confidence) => {
  switch (confidence) {
    case "H":
      return 0.5;
    case "M":
      return 0.25;
    case "L":
      return 0.1;
    default:
      return 0.5;
  }
};

// Function to get color based on confidence
const getColor = (confidence) => {
  switch (confidence) {
    case "H":
      return "rgba(255, 0, 0, 0.8)"; // Red for high confidence
    case "M":
      return "rgba(255, 165, 0, 0.8)"; // Orange for medium confidence
    case "L":
      return "rgba(255, 255, 0, 0.8)"; // Yellow for low confidence
    default:
      return "rgba(255, 0, 0, 0.6)"; // Default color
  }
};

const CustomMarker = ({ lat, lng, confidence, acqDate, acqTime }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Dynamic size based on confidence
  const size = confidence === "H" ? 12 : confidence === "M" ? 10 : 8;

  // Animation effect on load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100); // Delay for animation
    return () => clearTimeout(timer);
  }, []);

  return (
    <OverlayView
      position={{ lat, lng }}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <div
        style={{
          background: getColor(confidence),
          border: "1px solid white",
          borderRadius: "50%",
          width: `${size}px`,
          height: `${size}px`,
          opacity: getOpacity(confidence),
          transform: `translate(-50%, -50%) ${isVisible ? 'scale(1)' : 'scale(0.5)'}`, // Scale effect on load
          boxShadow: "0 2px 5px rgba(0, 0, 0, 0.3)",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isHovered && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '6px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            zIndex: 10,
            color: 'black', // Change text color to black
            boxShadow: "0 2px 5px rgba(0, 0, 0, 0.3)", // Shadow for tooltip
          }}>
            <div>Confidence: {confidence}</div>
            <div>Acquisition Date: {acqDate}</div>
            <div>Acquisition Time: {acqTime}</div>
          </div>
        )}
      </div>
    </OverlayView>
  );
};

export default CustomMarker;  