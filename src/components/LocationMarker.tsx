import React from 'react';

const LocationMarker = () => {
  return (
    <div className="relative">
      <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
      <div className="absolute -inset-2 bg-blue-500/20 rounded-full animate-ping" />
    </div>
  );
};

export default LocationMarker;