import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useToast } from '@/components/ui/use-toast';
import LocationCard from './LocationCard';

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const { toast } = useToast();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    mapInstance.current = L.map(mapContainer.current).setView([0, 0], 2);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance.current);

    // Add zoom controls
    mapInstance.current.zoomControl.setPosition('bottomright');

    // Get user's location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
          
          if (mapInstance.current) {
            mapInstance.current.setView([latitude, longitude], 15);

            // Create a custom icon
            const pulsingIcon = L.divIcon({
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

            // Add marker to map
            if (marker.current) {
              marker.current.remove();
            }
            marker.current = L.marker([latitude, longitude], { icon: pulsingIcon })
              .addTo(mapInstance.current);
          }
          setLoading(false);
        },
        (error) => {
          toast({
            title: "Location Error",
            description: "Unable to get your location. Please enable location services.",
            variant: "destructive"
          });
          setLoading(false);
        }
      );
    }

    return () => {
      if (marker.current) {
        marker.current.remove();
      }
      if (mapInstance.current) {
        mapInstance.current.remove();
      }
    };
  }, [toast]);

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="absolute inset-0" />
      {location && <LocationCard 
        latitude={location.lat} 
        longitude={location.lng}
        loading={loading}
      />}
    </div>
  );
};

export default Map;