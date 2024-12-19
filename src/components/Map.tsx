import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useToast } from '@/components/ui/use-toast';
import LocationCard from './LocationCard';

interface UserLocation {
  id: string;
  lat: number;
  lng: number;
  timestamp: number;
}

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markers = useRef<{ [key: string]: L.Marker }>({});
  const { toast } = useToast();
  const [userLocations, setUserLocations] = useState<UserLocation[]>([]);
  const [myLocation, setMyLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);

  // Generate a random user ID
  const userId = useRef<string>(Math.random().toString(36).substring(7));

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

  const updateUserLocation = (location: UserLocation) => {
    setUserLocations(prev => {
      const filtered = prev.filter(loc => loc.id !== location.id);
      return [...filtered, location];
    });
  };

  const broadcastLocation = (lat: number, lng: number) => {
    const location: UserLocation = {
      id: userId.current,
      lat,
      lng,
      timestamp: Date.now()
    };
    setMyLocation(location);
    updateUserLocation(location);
  };

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
          if (mapInstance.current) {
            mapInstance.current.setView([latitude, longitude], 15);
            broadcastLocation(latitude, longitude);
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

      // Watch for location updates
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          broadcastLocation(latitude, longitude);
        },
        (error) => {
          console.error('Error watching position:', error);
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }

    return () => {
      Object.values(markers.current).forEach(marker => marker.remove());
      if (mapInstance.current) {
        mapInstance.current.remove();
      }
    };
  }, [toast]);

  // Update markers when user locations change
  useEffect(() => {
    if (!mapInstance.current) return;

    // Remove old markers
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

    // Add new markers
    userLocations.forEach(location => {
      if (!markers.current[location.id] && mapInstance.current) {
        const marker = L.marker([location.lat, location.lng], {
          icon: createPulsingIcon()
        }).addTo(mapInstance.current);

        marker.bindPopup(`User ${location.id}`);
        markers.current[location.id] = marker;
      }
    });
  }, [userLocations]);

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="absolute inset-0" />
      {myLocation && (
        <LocationCard 
          latitude={myLocation.lat} 
          longitude={myLocation.lng}
          loading={loading}
        />
      )}
    </div>
  );
};

export default Map;