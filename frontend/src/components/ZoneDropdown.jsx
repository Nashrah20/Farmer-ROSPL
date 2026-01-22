import React from 'react';

// Zone display name mapping
const ZONE_LABELS = {
  'CS1': '🌾 Coarse Soil - Groundnut (NorthMaha)',
  'CS2': '🌾 Coarse Soil - Bajra (WestMaha)',
  'CS3': '🍉 Coarse Soil - Watermelon (Vidarbha)',
  'BS1': '🌿 Black Soil - Cotton (Vidarbha)',
  'BS2': '🌱 Black Soil - Soybean (WestMaha)',
  'BS3': '🌾 Black Soil - Jowar (NorthMaha)',
  'LS1': '🌰 Laterite Soil - Cashew (Konkan)',
  'LS2': '🥥 Laterite Soil - Coconut (Konkan)',
  'LS3': '🌾 Laterite Soil - Rice (Konkan)',
  'AS1': '🍬 Alluvial Soil - Sugarcane (WestMaha)',
  'AS2': '🌾 Alluvial Soil - Wheat (NorthMaha)',
  'AS3': '🍌 Alluvial Soil - Banana (WestMaha)',
  'YS1': '🌾 Yellow-Brown Soil - Rice (Konkan)',
  'YS2': '🌾 Yellow-Brown Soil - Ragi (Vidarbha)',
  'YS3': '🌾 Yellow-Brown Soil - Tur (NorthMaha)',
};

const ZoneDropdown = ({ zones, selectedZone, onZoneChange, loading }) => {
  return (
    <div className="w-full">
      <label htmlFor="zone-select" className="block text-sm font-medium text-gray-700 mb-2">
        Select Farm Zone
      </label>
      <select
        id="zone-select"
        value={selectedZone}
        onChange={(e) => onZoneChange(e.target.value)}
        disabled={loading}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
      >
        <option value="">Select a zone...</option>
        {zones.map((zone) => (
          <option key={zone} value={zone}>
            {ZONE_LABELS[zone] || zone}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ZoneDropdown;
