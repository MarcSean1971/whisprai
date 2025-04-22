
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getIceServers } from './get-ice-servers';
import { toast } from 'sonner';

interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

interface IceServersCache {
  servers: IceServer[];
  expiresAt: number;
}

const ICE_SERVERS_CACHE_KEY = 'webrtc-ice-servers-cache';
const CACHE_BUFFER_TIME = 60 * 60 * 1000; // 1 hour buffer before expiration
const FETCH_TIMEOUT = 10000; // 10 seconds timeout for fetching credentials
const MAX_RETRIES = 3;

export function useIceServers() {
  const [iceServers, setIceServers] = useState<IceServer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const getCachedServers = useCallback((): IceServersCache | null => {
    try {
      const cachedData = localStorage.getItem(ICE_SERVERS_CACHE_KEY);
      if (!cachedData) return null;
      
      const cache = JSON.parse(cachedData) as IceServersCache;
      const now = Date.now();
      
      if (cache.expiresAt > now + CACHE_BUFFER_TIME) {
        console.log('[WebRTC] Using cached ICE servers, expires in:', 
          Math.round((cache.expiresAt - now) / 1000 / 60), 'minutes');
        return cache;
      }
      
      localStorage.removeItem(ICE_SERVERS_CACHE_KEY);
      return null;
    } catch (error) {
      console.error('[WebRTC] Error retrieving cached ICE servers:', error);
      localStorage.removeItem(ICE_SERVERS_CACHE_KEY);
      return null;
    }
  }, []);

  const fetchIceServers = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      
      if (!forceRefresh) {
        const cachedServers = getCachedServers();
        if (cachedServers) {
          setIceServers(cachedServers.servers);
          setIsLoading(false);
          return;
        }
      }
      
      console.log('[WebRTC] Fetching fresh ICE servers, attempt:', retryCount + 1);
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('ICE servers fetch timeout')), FETCH_TIMEOUT);
      });
      
      // Add detailed logging for the edge function call
      console.log('[WebRTC] Calling generate-turn-credentials edge function');
      const fetchPromise = supabase.functions.invoke('generate-turn-credentials');
      
      const result = await Promise.race([fetchPromise, timeoutPromise]);
      console.log('[WebRTC] Edge function response:', result);
      
      const { data, error } = result;
      
      if (error) {
        console.error('[WebRTC] Edge function error:', error);
        throw error;
      }
      
      if (data?.ice_servers) {
        console.log('[WebRTC] Successfully fetched ICE servers:', 
          data.ice_servers.length, 'servers');
        
        // Log each ICE server for debugging
        data.ice_servers.forEach((server: IceServer, index: number) => {
          const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
          console.log(`[WebRTC] ICE Server #${index + 1}:`, {
            urls,
            hasCredentials: !!(server.username && server.credential)
          });
        });
        
        setIceServers(data.ice_servers);
        if (data.ttl) {
          const cache: IceServersCache = {
            servers: data.ice_servers,
            expiresAt: Date.now() + (data.ttl * 1000)
          };
          localStorage.setItem(ICE_SERVERS_CACHE_KEY, JSON.stringify(cache));
          console.log('[WebRTC] Cached ICE servers with TTL:', data.ttl, 'seconds');
        }
      } else {
        console.warn('[WebRTC] No ICE servers returned from server:', data);
        throw new Error('No ICE servers returned from server');
      }
    } catch (err) {
      console.error('[WebRTC] Error fetching ICE servers:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch ICE servers'));
      
      // Use fallback servers on error
      const fallbackServers = getIceServers();
      console.warn('[WebRTC] Using fallback ICE servers:', fallbackServers);
      setIceServers(fallbackServers);
      
      // Retry logic
      if (retryCount < MAX_RETRIES) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
        console.log(`[WebRTC] Retrying in ${delay/1000}s...`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchIceServers(true);
        }, delay);
      } else if (retryCount === 0) {
        toast.error('Network connection issue. Using fallback servers.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [getCachedServers, retryCount]);

  useEffect(() => {
    fetchIceServers();
  }, [fetchIceServers]);

  return { 
    iceServers, 
    isLoading, 
    error, 
    refreshIceServers: () => {
      setRetryCount(0);
      return fetchIceServers(true);
    }
  };
}
