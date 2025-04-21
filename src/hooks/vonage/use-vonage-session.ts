
import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VonageSessionOptions, VonageError, VonageSessionData } from "./types";

export function useVonageSession({ conversationId = 'default', recipientId }: VonageSessionOptions) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<VonageError | null>(null);
  const sessionRef = useRef<any>(null);
  const sessionDataRef = useRef<VonageSessionData | null>(null);

  const initializeSession = useCallback(async () => {
    if (!conversationId || !recipientId) {
      console.error('Missing required parameters:', { conversationId, recipientId });
      setError({
        type: 'SESSION_ERROR',
        message: "Missing required parameters"
      });
      return null;
    }

    try {
      console.log('[Vonage Session] Initializing session...', { conversationId, recipientId });
      
      // Check if we already have session data
      if (sessionDataRef.current) {
        console.log('[Vonage Session] Using existing session data');
        return sessionDataRef.current;
      }
      
      const { data: sessionData, error: sessionError } = await supabase.functions.invoke('vonage-session', {
        body: { conversationId, recipientId }
      });

      if (sessionError || !sessionData) {
        console.error('[Vonage Session] Failed to create session:', sessionError || 'No session data received');
        throw new Error(sessionError?.message || "Failed to create session");
      }

      const { sessionId, token, apiKey } = sessionData;

      if (!sessionId || !token || !apiKey) {
        console.error('[Vonage Session] Invalid session data received:', sessionData);
        throw new Error("Invalid session data received");
      }

      console.log('[Vonage Session] Session created successfully:', { 
        sessionId,
        hasToken: !!token,
        hasApiKey: !!apiKey 
      });

      // Store session data for reuse
      sessionDataRef.current = { sessionId, token, apiKey };
      return { sessionId, token, apiKey };

    } catch (err: any) {
      const vonageError: VonageError = {
        type: 'INITIALIZATION_ERROR',
        message: err.message || "Failed to initialize session",
        originalError: err
      };
      console.error('[Vonage Session] Error:', vonageError);
      setError(vonageError);
      return null;
    }
  }, [conversationId, recipientId]);

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
    setSession: (session: any) => {
      sessionRef.current = session;
    },
    initializeSession,
    disconnect
  };
}
