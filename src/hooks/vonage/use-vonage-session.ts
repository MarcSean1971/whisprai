import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VonageSessionOptions, VonageError, VonageSessionData } from "./types";

export function useVonageSession({ conversationId = 'default', recipientId }: VonageSessionOptions) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<VonageError | null>(null);
  const sessionRef = useRef<any>(null);

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
        sessionRef.current.disconnect();
        sessionRef.current = null;
        setIsConnected(false);
        setIsConnecting(false);
      } catch (err: any) {
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
    initializeSession,
    disconnect
  };
}
