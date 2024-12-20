import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserLocation {
  id: string;
  lat: number;
  lng: number;
  timestamp: number;
}

export const useLocationSubscription = () => {
  const [userLocations, setUserLocations] = useState<UserLocation[]>([]);

  useEffect(() => {
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

          setUserLocations(prev => {
            const filtered = prev.filter(loc => loc.id !== location.id);
            return [...filtered, location];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { userLocations };
};