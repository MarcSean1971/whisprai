
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { NetworkStatus } from "@/components/ui/network-status";

interface ConnectionState {
  isOnline: boolean;
  lastPingTime: number | null;
  reconnectAttempts: number;
}

export function useConnectionManager() {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isOnline: navigator.onLine,
    lastPingTime: null,
    reconnectAttempts: 0,
  });
  
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clean up function to clear all timers
  const clearAllTimers = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);
  
  // Function to refresh auth token when needed
  const refreshAuthToken = useCallback(async () => {
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Failed to refresh auth token:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error refreshing auth token:', err);
      return false;
    }
  }, []);
  
  // Function to check connection via a lightweight ping
  const pingConnection = useCallback(async () => {
    try {
      const start = Date.now();
      const { data, error } = await supabase.from('user_presence').select('count(*)', { count: 'exact', head: true });
      
      if (error) {
        console.warn('Ping failed:', error);
        setConnectionState(prev => ({
          ...prev,
          isOnline: false
        }));
        return false;
      }
      
      const latency = Date.now() - start;
      console.log(`Connection ping successful (${latency}ms)`);
      
      setConnectionState(prev => ({
        ...prev,
        isOnline: true,
        lastPingTime: Date.now(),
        reconnectAttempts: 0
      }));
      
      return true;
    } catch (err) {
      console.error('Error pinging connection:', err);
      setConnectionState(prev => ({
        ...prev,
        isOnline: false
      }));
      return false;
    }
  }, []);
  
  // Handle reconnection with exponential backoff
  const attemptReconnection = useCallback(async () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    // Exponential backoff (base: 2 seconds, max: ~2 minutes)
    const backoffTime = Math.min(2000 * Math.pow(2, connectionState.reconnectAttempts), 120000);
    
    console.log(`Attempting reconnection in ${backoffTime}ms (attempt ${connectionState.reconnectAttempts + 1})`);
    
    reconnectTimeoutRef.current = setTimeout(async () => {
      const tokenRefreshed = await refreshAuthToken();
      const connectionRestored = await pingConnection();
      
      if (tokenRefreshed && connectionRestored) {
        toast({
          title: "Connection restored",
          description: "You're back online. Messages will update automatically.",
        });
        
        // Invalidate queries to refresh data
        // This would be done via the query client directly in specific components
      } else {
        // Increment reconnect attempts for exponential backoff
        setConnectionState(prev => ({
          ...prev,
          reconnectAttempts: prev.reconnectAttempts + 1
        }));
        
        // Try again with longer delay
        attemptReconnection();
      }
    }, backoffTime);
  }, [connectionState.reconnectAttempts, pingConnection, refreshAuthToken]);
  
  // Set up event listeners for online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log("Browser reports online status");
      setConnectionState(prev => ({
        ...prev,
        isOnline: true
      }));
      
      // When coming back online, refresh token and ping
      refreshAuthToken().then(() => pingConnection());
    };
    
    const handleOffline = () => {
      console.log("Browser reports offline status");
      setConnectionState(prev => ({
        ...prev,
        isOnline: false
      }));
    };
    
    // Handle visibility change (app going to background/foreground)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("App returned to foreground");
        refreshAuthToken().then(() => {
          pingConnection();
          
          // Reset any reconnection attempts
          setConnectionState(prev => ({
            ...prev,
            reconnectAttempts: 0
          }));
        });
      } else {
        console.log("App went to background");
        // Optionally pause some operations when in background
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set up regular ping interval (every 30 seconds)
    pingIntervalRef.current = setInterval(() => {
      if (navigator.onLine && document.visibilityState === "visible") {
        pingConnection();
      }
    }, 30000);
    
    // Initial ping
    pingConnection();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearAllTimers();
    };
  }, [clearAllTimers, pingConnection, refreshAuthToken]);
  
  // When connection state changes to offline, attempt reconnection
  useEffect(() => {
    if (!connectionState.isOnline && navigator.onLine) {
      attemptReconnection();
    }
  }, [connectionState.isOnline, attemptReconnection]);
  
  return {
    isOnline: connectionState.isOnline,
    lastPingTime: connectionState.lastPingTime,
    refreshConnection: async () => {
      await refreshAuthToken();
      return pingConnection();
    }
  };
}
