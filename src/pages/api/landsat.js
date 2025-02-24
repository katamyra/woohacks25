import axios from 'axios';

export default async function handler(req, res) {
  const { date = '2025-02-21', dayRange = 1 } = req.query;

  try {
    const response = await axios.get(`https://firms.modaps.eosdis.nasa.gov/usfs/api/area/csv/86826bfcd41fb44eb1413d50232a1444/LANDSAT_NRT/world/${dayRange}/${date}`);
    
    // Convert CSV to JSON
    const csvData = response.data.trim().split("\n");
    const headers = csvData[0].split(",");

    const jsonData = csvData.slice(1).map(row => {
      const values = row.split(",");
      return headers.reduce((acc, key, index) => {
        acc[key] = values[index];
        return acc;
      }, {});
    });

    res.status(200).json({
      success: true,
      data: jsonData
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch LANDSAT data',
      error: error.message
    });
  }
}
