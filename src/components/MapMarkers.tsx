import { useEffect, useRef } from 'react';
import L from 'leaflet';

interface MapMarkersProps {
  map: L.Map | null;
  locations: Array<{
    id: string;
    lat: number;
    lng: number;
    timestamp: number;
  }>;
  currentUserId?: string;
}

export const MapMarkers = ({ map, locations, currentUserId }: MapMarkersProps) => {
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  const createPulsingIcon = () => {
    return L.divIcon({
      className: 'custom-icon',
      html: `
        <div class="relative">
          <div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
          <div class="absolute -inset-2 bg-blue-500/20 rounded-full animate-ping"></div>
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  };

  useEffect(() => {
    if (!map) return;

    // Remove old markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // Add new markers
    locations.forEach(location => {
      if (!markersRef.current[location.id] && map) {
        const marker = L.marker([location.lat, location.lng], {
          icon: createPulsingIcon()
        }).addTo(map);

        const timeAgo = Math.round((Date.now() - location.timestamp) / 1000 / 60);
        marker.bindPopup(`User ${location.id === currentUserId ? '(You)' : location.id.slice(0, 8)}
          <br>Last updated: ${timeAgo} minutes ago`);
        markersRef.current[location.id] = marker;
      }
    });

    return () => {
      Object.values(markersRef.current).forEach(marker => marker.remove());
    };
  }, [map, locations, currentUserId]);

  return null;
};