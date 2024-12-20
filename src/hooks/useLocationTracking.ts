import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UseLocationTrackingProps {
  userId?: string;
  onLocationUpdate?: (lat: number, lng: number) => void;
}

export const useLocationTracking = ({ userId, onLocationUpdate }: UseLocationTrackingProps) => {
  const [isSharing, setIsSharing] = useState(false);
  const watchId = useRef<number | null>(null);
  const { toast } = useToast();

  const updateUserLocation = async (lat: number, lng: number) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('user_locations')
        .upsert({
          user_id: userId,
          location: `POINT(${lng} ${lat})`,
          last_updated: new Date().toISOString()
        });

      if (error) throw error;
      
      // Notify parent component of location update
      onLocationUpdate?.(lat, lng);
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
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
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
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  return {
    isSharing,
    startSharingLocation,
    stopSharingLocation
  };
};