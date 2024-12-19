import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-css';
import { useToast } from '@/components/ui/use-toast';
import LocationCard from './LocationCard';

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const { toast } = useToast();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    mapboxgl.accessToken = 'pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbHNlOHNpYmswMDJqMmtvNWR4NWJyYnB5In0.qXhv1VkOiHdLRzlJ8Qh8dw';
    
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      zoom: 15,
      center: [0, 0],
    });

    mapInstance.current = map;

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    // Get user's location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
          
          if (mapInstance.current) {
            mapInstance.current.flyTo({
              center: [longitude, latitude],
              zoom: 15,
              essential: true
            });

            // Create a custom marker element
            const el = document.createElement('div');
            el.className = 'relative';
            el.innerHTML = `
              <div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
              <div class="absolute -inset-2 bg-blue-500/20 rounded-full animate-ping"></div>
            `;

            // Add marker to map
            if (marker.current) {
              marker.current.remove();
            }
            marker.current = new mapboxgl.Marker(el)
              .setLngLat([longitude, latitude])
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