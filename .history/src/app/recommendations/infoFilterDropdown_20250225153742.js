// FilterDropdown.js
import React from "react";

const FilterDropdown = ({
  filterSearch,
  setFilterSearch,
  filteredFilterOptions,
  selectedFilters,
  setSelectedFilters,
}) => {
  const toggleFilter = (option) => {
    // If already selected, remove it.
    if (selectedFilters.includes(option)) {
      setSelectedFilters(selectedFilters.filter((f) => f !== option));
    } else {
      if (selectedFilters.length < 15) {
        setSelectedFilters([...selectedFilters, option]);
      }
    }
  };

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
        width: "200px",
      }}
    >
      <input
        type="text"
        value={filterSearch}
        onChange={(e) => setFilterSearch(e.target.value)}
        placeholder="Search filters..."
        style={{
          width: "100%",
          padding: "5px",
          marginBottom: "10px",
          boxSizing: "border-box",
        }}
      />
      <div style={{ maxHeight: "150px", overflowY: "auto" }}>
        {filteredFilterOptions.map((option) => {
          const disabled =
            selectedFilters.length >= 15 && !selectedFilters.includes(option);
          return (
            <div
              key={option}
              style={{
                padding: "5px",
                cursor: disabled ? "not-allowed" : "pointer",
                display: "flex",
                justifyContent: "space-between",
                backgroundColor: selectedFilters.includes(option)
                  ? "#eee"
                  : "#fff",
                color: disabled ? "gray" : "black",
              }}
              onClick={() => {
                if (!disabled) toggleFilter(option);
              }}
            >
              <span>{option}</span>
              {selectedFilters.includes(option) && <span>&#x2713;</span>}
            </div>
          );
        })}
        {filteredFilterOptions.length === 0 && (
          <div style={{ padding: "5px" }}>No matches</div>
        )}
      </div>
    </div>
  );
};

export default FilterDropdown;
