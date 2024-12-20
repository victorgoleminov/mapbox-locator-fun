import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import LocationCard from './LocationCard';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/App';

interface UserLocation {
  id: string;
  lat: number;
  lng: number;
  timestamp: number;
}

export const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markers = useRef<{ [key: string]: L.Marker }>({});
  const { toast } = useToast();
  const [userLocations, setUserLocations] = useState<UserLocation[]>([]);
  const [myLocation, setMyLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const watchId = useRef<number | null>(null);
  const session = useSession();

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

  const updateUserLocation = async (lat: number, lng: number) => {
    if (!session?.user?.id) return;

    try {
      const { error } = await supabase
        .from('user_locations')
        .upsert({
          user_id: session.user.id,
          location: `POINT(${lng} ${lat})`,
          last_updated: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating location:', error);
      toast({
        title: "Error",
        description: "Failed to update location",
        variant: "destructive"
      });
    }
  };

  const startSharingLocation = () => {
    if (!('geolocation' in navigator)) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive"
      });
      return;
    }

    setIsSharing(true);
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateUserLocation(latitude, longitude);
      },
      (error) => {
        toast({
          title: "Location Error",
          description: error.message,
          variant: "destructive"
        });
        setIsSharing(false);
      }
    );

    toast({
      title: "Location Sharing",
      description: "You are now sharing your location",
    });
  };

  const stopSharingLocation = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsSharing(false);
    toast({
      title: "Location Sharing Stopped",
      description: "You have stopped sharing your location",
    });
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

    // Get initial location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (mapInstance.current) {
            mapInstance.current.setView([latitude, longitude], 15);
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

    // Subscribe to real-time location updates
    const channel = supabase
      .channel('user_locations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_locations'
        },
        (payload: any) => {
          if (!payload.new || !payload.new.location) return;
          
          // Extract coordinates from PostGIS point
          const match = payload.new.location.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
          if (!match) return;
          
          const lng = parseFloat(match[1]);
          const lat = parseFloat(match[2]);
          
          const location: UserLocation = {
            id: payload.new.user_id,
            lat,
            lng,
            timestamp: new Date(payload.new.last_updated).getTime()
          };

          if (payload.new.user_id === session?.user?.id) {
            setMyLocation(location);
          }

          setUserLocations(prev => {
            const filtered = prev.filter(loc => loc.id !== location.id);
            return [...filtered, location];
          });
        }
      )
      .subscribe();

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
      supabase.removeChannel(channel);
      Object.values(markers.current).forEach(marker => marker.remove());
      if (mapInstance.current) {
        mapInstance.current.remove();
      }
    };
  }, [toast, session?.user?.id]);

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

        const timeAgo = Math.round((Date.now() - location.timestamp) / 1000 / 60);
        marker.bindPopup(`User ${location.id === session?.user?.id ? '(You)' : location.id.slice(0, 8)}
          <br>Last updated: ${timeAgo} minutes ago`);
        markers.current[location.id] = marker;
      }
    });
  }, [userLocations, session?.user?.id]);

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
    </div>
  );
};