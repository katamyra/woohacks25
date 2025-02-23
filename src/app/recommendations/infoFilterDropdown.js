// FilterDropdown.js
import React from "react";

const infoFilterDropdown = () => {
  const handleSort = (criteria) => {
    // Implement your sorting logic based on criteria (distance, category, etc.)
    console.log("Sorting by:", criteria);
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "25px",
        right: "0",
        backgroundColor: "black",
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "10px",
        zIndex: 100,
      }}
    >
      <p style={{ margin: "5px 0", cursor: "pointer" }} onClick={() => handleSort("distance")}>
        Sort by Distance
      </p>
      <p style={{ margin: "5px 0", cursor: "pointer" }} onClick={() => handleSort("category")}>
        Sort by Amenity Category
      </p>
    </div>
  );
};

export default infoFilterDropdown;
