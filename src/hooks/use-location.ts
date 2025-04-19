
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useLocation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = async (): Promise<{ latitude: number; longitude: number; accuracy: number } | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });

      const { latitude, longitude, accuracy } = position.coords;

      // Store location in Supabase
      const { error: dbError } = await supabase
        .from('user_locations')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          latitude,
          longitude,
          accuracy,
          last_updated: new Date().toISOString()
        });

      if (dbError) throw dbError;

      return { latitude, longitude, accuracy };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get location';
      setError(message);
      toast.error('Could not access location');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    requestLocation,
    isLoading,
    error
  };
}
