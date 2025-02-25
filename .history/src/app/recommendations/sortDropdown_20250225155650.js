"use client";
import React from "react";

const SortDropdown = ({ selectedSort, setSelectedSort }) => {
  const options = ["ETA", "Walkability"];
  return (
    <div
      style={{
        position: "absolute",
        top: "100%",
        right: 0,
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "10px",
        zIndex: 100,
      }}
    >
      {options.map((option) => (
        <div
          key={option}
          style={{
            padding: "5px",
            cursor: "pointer",
            backgroundColor: selectedSort === option ? "#eee" : "#fff",
            color: "black",
          }}
          onClick={() => setSelectedSort(option)}
        >
          {option}
        </div>
      ))}
    </div>
  );
};

export default SortDropdown;
