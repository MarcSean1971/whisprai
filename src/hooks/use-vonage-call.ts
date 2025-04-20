
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadVonageScript } from "@/lib/vonage-loader";

interface UseVonageCallProps {
  publisherElement: string;
  subscriberElement: string;
  recipientId: string;
  conversationId?: string;
}

export function useVonageCall({
  publisherElement,
  subscriberElement,
  recipientId,
  conversationId = 'default'
}: UseVonageCallProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [hasRemoteParticipant, setHasRemoteParticipant] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const sessionRef = useRef<any>(null);
  const publisherRef = useRef<any>(null);
  const subscriberRef = useRef<any>(null);
  
  const scriptLoaded = useRef(false);
  
  // Load the Vonage script if not already loaded
  useEffect(() => {
    if (!scriptLoaded.current) {
      loadVonageScript()
        .then(() => {
          scriptLoaded.current = true;
        })
        .catch((err) => {
          setError("Failed to load Vonage SDK: " + err.message);
        });
    }
    
    return () => {
      disconnect();
    };
  }, []);
  
  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      try {
        if (publisherRef.current) {
          sessionRef.current.unpublish(publisherRef.current);
          publisherRef.current.destroy();
          publisherRef.current = null;
        }
        
        if (subscriberRef.current) {
          sessionRef.current.unsubscribe(subscriberRef.current);
          subscriberRef.current = null;
        }
        
        sessionRef.current.disconnect();
        sessionRef.current = null;
      } catch (err) {
        console.error("Error disconnecting from session:", err);
      }
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    setHasRemoteParticipant(false);
  }, []);
  
  const connect = useCallback(async () => {
    if (!conversationId || !recipientId || !window.OT) {
      setError("Missing required parameters or Vonage SDK not loaded");
      return;
    }
    
    try {
      setIsConnecting(true);
      setError(null);
      
      // Get session information from our backend
      const { data, error: sessionError } = await supabase.functions.invoke('vonage-session', {
        body: { 
          conversationId, 
          recipientId 
        }
      });
      
      if (sessionError || !data) {
        throw new Error(sessionError?.message || "Failed to create session");
      }
      
      const { sessionId, token, apiKey } = data;
      
      if (!sessionId || !token || !apiKey) {
        throw new Error("Invalid session data received");
      }
      
      // Initialize the session
      sessionRef.current = window.OT.initSession(apiKey, sessionId);
      
      // Set up event handlers
      sessionRef.current.on('streamCreated', (event: any) => {
        // Fix here: The subscribe method expects different parameters based on the Vonage SDK types
        // Instead of passing separate parameters, we'll ensure we match the expected signature
        
        subscriberRef.current = sessionRef.current.subscribe(
          event.stream,
          subscriberElement,
          {
            insertMode: 'append',
            width: '100%',
            height: '100%'
          },
          (error: any) => {
            if (error) {
              console.error('Error subscribing to stream:', error);
            } else {
              setHasRemoteParticipant(true);
            }
          }
        );
      });
      
      sessionRef.current.on('streamDestroyed', (event: any) => {
        setHasRemoteParticipant(false);
        if (subscriberRef.current) {
          subscriberRef.current = null;
        }
      });
      
      // Initialize the publisher
      publisherRef.current = window.OT.initPublisher(
        publisherElement,
        {
          insertMode: 'append',
          width: '100%',
          height: '100%',
          publishAudio: true,
          publishVideo: false,
        },
        (error: any) => {
          if (error) {
            console.error('Error initializing publisher:', error);
            setError("Could not access camera/microphone");
          }
        }
      );
      
      // Connect to the session
      sessionRef.current.connect(token, (error: any) => {
        if (error) {
          console.error('Error connecting to session:', error);
          setError("Failed to connect to session");
          setIsConnecting(false);
          return;
        }
        
        // Publish our stream to the session
        sessionRef.current.publish(publisherRef.current, (pubError: any) => {
          if (pubError) {
            console.error('Error publishing stream:', pubError);
            setError("Failed to publish your stream");
            setIsConnecting(false);
            return;
          }
          
          setIsConnected(true);
          setIsConnecting(false);
        });
      });
      
    } catch (err: any) {
      console.error("Error setting up call:", err);
      setError(err.message || "Failed to set up call");
      setIsConnecting(false);
    }
  }, [conversationId, recipientId, publisherElement, subscriberElement]);
  
  const toggleVideo = useCallback(() => {
    if (publisherRef.current) {
      const hasVideo = publisherRef.current.getSettings().videoSource !== null;
      publisherRef.current.publishVideo(!hasVideo);
    }
  }, []);
  
  const toggleAudio = useCallback(() => {
    if (publisherRef.current) {
      const hasAudio = publisherRef.current.getSettings().audioSource !== null;
      publisherRef.current.publishAudio(!hasAudio);
    }
  }, []);
  
  return {
    isConnecting,
    isConnected,
    hasRemoteParticipant,
    error,
    connect,
    disconnect,
    toggleVideo,
    toggleAudio
  };
}
