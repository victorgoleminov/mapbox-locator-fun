import React from 'react';

interface LocationCardProps {
  latitude: number;
  longitude: number;
  loading: boolean;
}

const LocationCard = ({ latitude, longitude, loading }: LocationCardProps) => {
  if (loading) {
    return (
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg min-w-[200px]">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg">
      <h2 className="text-lg font-semibold mb-2">Your Location</h2>
      <div className="space-y-1 text-sm text-gray-600">
        <p>Latitude: {latitude.toFixed(6)}°</p>
        <p>Longitude: {longitude.toFixed(6)}°</p>
      </div>
    </div>
  );
};

export default LocationCard;