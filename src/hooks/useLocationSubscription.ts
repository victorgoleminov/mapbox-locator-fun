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
    // First get all current locations
    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from('user_locations')
        .select('user_id, location, last_updated');
      
      if (!error && data) {
        const locations = data.map(row => {
          const match = row.location.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
          if (!match) return null;
          
          return {
            id: row.user_id,
            lng: parseFloat(match[1]),
            lat: parseFloat(match[2]),
            timestamp: new Date(row.last_updated).getTime()
          };
        }).filter(Boolean) as UserLocation[];
        
        setUserLocations(locations);
      }
    };

    fetchLocations();

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