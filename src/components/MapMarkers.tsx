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

  const createUserIcon = (isCurrentUser: boolean) => {
    const color = isCurrentUser ? '#0ea5e9' : '#64748b';
    return L.divIcon({
      className: 'custom-icon',
      html: `
        <div class="relative">
          <div class="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center border-2" style="border-color: ${color}">
            <div class="text-sm font-semibold" style="color: ${color}">
              ${isCurrentUser ? 'You' : 'U'}
            </div>
          </div>
          <div class="absolute -bottom-1 left-1/2 -translate-x-1/2">
            <div class="w-2 h-2 rotate-45 bg-white shadow-lg" style="border-color: ${color}"></div>
          </div>
          ${isCurrentUser ? `
            <div class="absolute -inset-1 rounded-full animate-ping opacity-20" style="background-color: ${color}"></div>
          ` : ''}
        </div>
      `,
      iconSize: [40, 48],
      iconAnchor: [20, 48],
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
        const isCurrentUser = location.id === currentUserId;
        const marker = L.marker([location.lat, location.lng], {
          icon: createUserIcon(isCurrentUser),
          zIndexOffset: isCurrentUser ? 1000 : 0
        }).addTo(map);

        const timeAgo = Math.round((Date.now() - location.timestamp) / 1000 / 60);
        marker.bindPopup(`
          <div class="text-center">
            <div class="font-semibold">${isCurrentUser ? 'You' : `User ${location.id.slice(0, 8)}`}</div>
            <div class="text-sm text-gray-500">Last updated: ${timeAgo} minutes ago</div>
          </div>
        `);
        markersRef.current[location.id] = marker;
      }
    });

    return () => {
      Object.values(markersRef.current).forEach(marker => marker.remove());
    };
  }, [map, locations, currentUserId]);

  return null;
};