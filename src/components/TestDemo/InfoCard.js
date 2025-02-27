function calculateDistances() {
  // ... existing code ...
  setIsCalculating(true);
  
  // Add error handling to geolocation promise
  new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  })
  .then(position => {
    // ... existing calculation code ...
  })
  .catch(error => {
    console.error('Geolocation error:', error);
    setDistances(prev => ({...prev, [id]: 'Location access denied'}));
  })
  .finally(() => {
    setIsCalculating(false);  // Ensure calculating state is cleared
  });
}

// In the return statement, add error state handling:
{isCalculating ? (
  <div className="calculating">Calculating distance...</div>
) : distances[id] ? (
  typeof distances[id] === 'string' ? (
    <div className="error">{distances[id]}</div>
  ) : (
    <div className="distance">{distances[id]} km</div>
  )
) : null} 