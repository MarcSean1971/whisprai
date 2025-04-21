
import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VonageSessionOptions, VonageError, VonageSessionData } from "./types";
import { toast } from "sonner";

export function useVonageSession({ conversationId = 'default', recipientId }: VonageSessionOptions) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<VonageError | null>(null);
  const sessionRef = useRef<any>(null);
  const sessionDataRef = useRef<VonageSessionData | null>(null);
  const sessionRequestInProgress = useRef<boolean>(false);

  // Clear cached session data on error
  const clearSessionCache = useCallback(() => {
    console.log('[Vonage Session] Clearing session cache');
    sessionDataRef.current = null;
  }, []);

  const initializeSession = useCallback(async (callId?: string) => {
    if (!conversationId || !recipientId) {
      console.error('[Vonage Session] Missing required parameters:', { conversationId, recipientId });
      setError({
        type: 'SESSION_ERROR',
        message: "Missing required parameters for call"
      });
      return null;
    }

    // Prevent concurrent requests
    if (sessionRequestInProgress.current) {
      console.log('[Vonage Session] Session request already in progress, skipping');
      return sessionDataRef.current;
    }

    try {
      console.log('[Vonage Session] Initializing session...', { 
        conversationId, 
        recipientId, 
        callId,
        cached: !!sessionDataRef.current
      });
      
      // Skip cache if we had a previous error or if requested
      if (sessionDataRef.current && !error) {
        console.log('[Vonage Session] Using existing session data');
        return sessionDataRef.current;
      }
      
      sessionRequestInProgress.current = true;
      
      console.log('[Vonage Session] Calling vonage-session edge function');
      const { data: sessionData, error: sessionError } = await supabase.functions.invoke('vonage-session', {
        body: { conversationId, recipientId, callId }
      });

      if (sessionError) {
        console.error('[Vonage Session] Edge function error:', sessionError);
        throw new Error(sessionError.message || "Failed to create session: Edge function error");
      }
      
      if (!sessionData) {
        console.error('[Vonage Session] No session data received from edge function');
        throw new Error("No session data received from server");
      }

      if (sessionData.error) {
        console.error('[Vonage Session] Edge function returned error:', sessionData.error);
        throw new Error(sessionData.error);
      }

      const { sessionId, token, apiKey } = sessionData;

      if (!sessionId || !token || !apiKey) {
        console.error('[Vonage Session] Invalid session data received:', sessionData);
        throw new Error("Invalid session data received");
      }

      console.log('[Vonage Session] Session created successfully:', { 
        sessionId,
        hasToken: !!token && token.length > 0,
        tokenLength: token?.length || 0,
        hasApiKey: !!apiKey 
      });

      // Store session data for reuse
      sessionDataRef.current = { sessionId, token, apiKey };
      return { sessionId, token, apiKey };

    } catch (err: any) {
      // Clear session cache on any error
      clearSessionCache();
      
      const errorMessage = err instanceof Error ? err.message : String(err);
      const vonageError: VonageError = {
        type: 'INITIALIZATION_ERROR',
        message: "Failed to initialize session: " + errorMessage,
        originalError: err
      };
      console.error('[Vonage Session] Error:', vonageError);
      setError(vonageError);
      toast.error("Call setup failed: " + errorMessage);
      return null;
    } finally {
      sessionRequestInProgress.current = false;
    }
  }, [conversationId, recipientId, error, clearSessionCache]);

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      try {
        console.log('[Vonage Session] Disconnecting session');
        sessionRef.current.disconnect();
        sessionRef.current = null;
        setIsConnected(false);
        setIsConnecting(false);
      } catch (err: any) {
        console.error('[Vonage Session] Error disconnecting:', err);
        const vonageError: VonageError = {
          type: 'CONNECTION_ERROR',
          message: "Error disconnecting from session",
          originalError: err
        };
        setError(vonageError);
      }
    }
  }, []);

  return {
    session: sessionRef.current,
    isConnecting,
    isConnected,
    error,
    setIsConnecting,
    setIsConnected,
    setError,
    clearSessionCache,
    setSession: (session: any) => {
      sessionRef.current = session;
    },
    initializeSession,
    disconnect
  };
}
