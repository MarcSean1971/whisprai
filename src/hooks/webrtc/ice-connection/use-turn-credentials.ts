
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getIceServers } from './get-ice-servers';
import { toast } from 'sonner';

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 second

export function useTurnCredentials() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchWithRetry = useCallback(async (retryCount = 0): Promise<any> => {
    try {
      console.log("[WebRTC] Fetching TURN credentials, attempt:", retryCount + 1);
      
      const { data, error } = await supabase.functions.invoke('generate-turn-credentials', {
        body: { timestamp: Date.now() }
      });

      if (error) {
        throw new Error(`Failed to fetch TURN credentials: ${error.message}`);
      }

      if (!data?.ice_servers || !Array.isArray(data.ice_servers)) {
        throw new Error('Invalid TURN credentials response format');
      }

      console.log("[WebRTC] Successfully fetched TURN credentials");
      return data;
    } catch (err) {
      console.error("[WebRTC] Error fetching TURN credentials:", err);
      
      if (retryCount < MAX_RETRIES) {
        const delay = INITIAL_DELAY * Math.pow(2, retryCount);
        console.log(`[WebRTC] Retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(retryCount + 1);
      }
      
      throw err;
    }
  }, []);

  const getTurnCredentials = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session?.access_token) {
        console.warn("[WebRTC] No authentication session found, using fallback servers");
        return getIceServers();
      }

      const data = await fetchWithRetry();
      return data.ice_servers;
    } catch (err) {
      console.error("[WebRTC] Final error fetching TURN credentials:", err);
      setError(err as Error);
      toast.error("Using fallback servers due to connection issue");
      return getIceServers();
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithRetry]);

  return {
    getTurnCredentials,
    isLoading,
    error
  };
}
