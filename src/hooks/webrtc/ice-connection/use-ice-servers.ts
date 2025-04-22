
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

// Retrieve cached ICE servers if available and not expired
const getCachedIceServers = (): IceServersCache | null => {
  try {
    const cachedData = localStorage.getItem(ICE_SERVERS_CACHE_KEY);
    if (!cachedData) return null;
    
    const cache = JSON.parse(cachedData) as IceServersCache;
    const now = Date.now();
    
    // Return cache if it's still valid (with buffer time)
    if (cache.expiresAt > now + CACHE_BUFFER_TIME) {
      console.log('[WebRTC] Using cached ICE servers');
      return cache;
    }
    
    // Cache is expired
    localStorage.removeItem(ICE_SERVERS_CACHE_KEY);
    return null;
  } catch (error) {
    console.error('[WebRTC] Error retrieving cached ICE servers:', error);
    localStorage.removeItem(ICE_SERVERS_CACHE_KEY);
    return null;
  }
};

// Cache ICE servers with expiration
const cacheIceServers = (servers: IceServer[], ttl: number): void => {
  try {
    const expiresAt = Date.now() + (ttl * 1000); // ttl in seconds, convert to ms
    const cacheData: IceServersCache = { servers, expiresAt };
    localStorage.setItem(ICE_SERVERS_CACHE_KEY, JSON.stringify(cacheData));
    console.log(`[WebRTC] Cached ICE servers. Expires at: ${new Date(expiresAt).toISOString()}`);
  } catch (error) {
    console.error('[WebRTC] Error caching ICE servers:', error);
  }
};

export function useIceServers() {
  const [iceServers, setIceServers] = useState<IceServer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [fetchAttempt, setFetchAttempt] = useState(0);

  const fetchIceServers = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      
      // Check for cached servers first, unless force refresh is requested
      if (!forceRefresh) {
        const cachedServers = getCachedIceServers();
        if (cachedServers) {
          setIceServers(cachedServers.servers);
          setIsLoading(false);
          return;
        }
      }
      
      // Fetch fresh servers from edge function with timeout
      console.log('[WebRTC] Fetching fresh ICE servers from edge function');
      
      // Create a promise that rejects after timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('ICE servers fetch timeout')), FETCH_TIMEOUT);
      });
      
      // Create the fetch promise
      const fetchPromise = supabase.functions.invoke('generate-turn-credentials');
      
      // Race the fetch against the timeout
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (error) {
        throw new Error(`Failed to fetch ICE servers: ${error.message}`);
      }
      
      if (data && data.ice_servers) {
        console.log('[WebRTC] Successfully fetched ICE servers:', data.ice_servers.length);
        setIceServers(data.ice_servers);
        
        // Cache the servers
        if (data.ttl) {
          cacheIceServers(data.ice_servers, data.ttl);
        }
      } else {
        console.warn('[WebRTC] No ICE servers returned, using fallback servers');
        const fallbackServers = getIceServers();
        setIceServers(fallbackServers);
      }
    } catch (err) {
      console.error('[WebRTC] Error in useIceServers:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch ICE servers'));
      
      // Use fallback servers on error
      console.warn('[WebRTC] Using fallback ICE servers');
      const fallbackServers = getIceServers();
      setIceServers(fallbackServers);
      
      if (fetchAttempt === 0) {
        toast.error('Network connection issue. Using fallback servers.', {
          id: 'ice-servers-error',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchAttempt]);
  
  useEffect(() => {
    fetchIceServers();
  }, [fetchIceServers]);
  
  // Force refresh ice servers - useful when a connection fails
  const refreshIceServers = useCallback(async () => {
    console.log('[WebRTC] Forcing refresh of ICE servers');
    localStorage.removeItem(ICE_SERVERS_CACHE_KEY);
    setFetchAttempt(prev => prev + 1);
    await fetchIceServers(true);
  }, [fetchIceServers]);
  
  return { iceServers, isLoading, error, refreshIceServers };
}
