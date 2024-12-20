import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import LocationCard from './LocationCard';
import { useSession } from '@/App';
import { UserLocationsList } from './UserLocationsList';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { useToast } from '@/components/ui/use-toast';
import { useLocationSubscription } from '@/hooks/useLocationSubscription';
import { MapMarkers } from './MapMarkers';

interface UserLocation {
  id: string;
  lat: number;
  lng: number;
  timestamp: number;
}

export const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const { toast } = useToast();
  const [myLocation, setMyLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const session = useSession();
  const { userLocations } = useLocationSubscription();
  
  const { isSharing, startSharingLocation, stopSharingLocation } = useLocationTracking({
    userId: session?.user?.id,
    onLocationUpdate: (lat, lng) => {
      if (mapInstance.current) {
        mapInstance.current.setView([lat, lng], 15);
      }
      setMyLocation({
        id: session?.user?.id || 'current',
        lat,
        lng,
        timestamp: Date.now()
      });
    }
  });

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

    // Get initial location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (mapInstance.current) {
            mapInstance.current.setView([latitude, longitude], 15);
            setMyLocation({
              id: session?.user?.id || 'current',
              lat: latitude,
              lng: longitude,
              timestamp: Date.now()
            });
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
      if (mapInstance.current) {
        mapInstance.current.remove();
      }
    };
  }, [toast, session?.user?.id]);

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute top-4 right-4 z-[1000]">
        <Button
          onClick={isSharing ? stopSharingLocation : startSharingLocation}
          variant={isSharing ? "destructive" : "default"}
          className="flex items-center gap-2"
        >
          <Share2 className="h-4 w-4" />
          {isSharing ? "Stop Sharing" : "Share My Location"}
        </Button>
      </div>
      {myLocation && (
        <LocationCard 
          latitude={myLocation.lat} 
          longitude={myLocation.lng}
          loading={loading}
        />
      )}
      <MapMarkers 
        map={mapInstance.current}
        locations={userLocations}
        currentUserId={session?.user?.id}
      />
      <UserLocationsList
        locations={userLocations}
        currentUserId={session?.user?.id}
        isSharing={isSharing}
        onStopSharing={stopSharingLocation}
      />
    </div>
  );
};