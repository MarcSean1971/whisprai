
import { useState, useEffect, useCallback } from 'react';
import { useTurnCredentials } from './use-turn-credentials';

interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export function useIceServers() {
  const [iceServers, setIceServers] = useState<IceServer[]>([]);
  const { getTurnCredentials, isLoading } = useTurnCredentials();

  const fetchIceServers = useCallback(async (forceRefresh = false) => {
    console.log("[WebRTC] Fetching ICE servers, force refresh:", forceRefresh);
    
    try {
      const servers = await getTurnCredentials();
      console.log("[WebRTC] Got ICE servers:", servers.length);
      
      // Log each ICE server for debugging
      servers.forEach((server: IceServer, index: number) => {
        const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
        console.log(`[WebRTC] ICE Server #${index + 1}:`, {
          urls,
          hasCredentials: !!(server.username && server.credential)
        });
      });
      
      setIceServers(servers);
    } catch (err) {
      console.error("[WebRTC] Error setting up ICE servers:", err);
    }
  }, [getTurnCredentials]);

  useEffect(() => {
    fetchIceServers();
  }, [fetchIceServers]);

  return {
    iceServers,
    isLoading,
    refreshIceServers: () => fetchIceServers(true)
  };
}
