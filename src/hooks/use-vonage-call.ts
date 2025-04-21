import { useEffect, useCallback, useRef, useState } from "react";
import { loadVonageScript } from "@/lib/vonage-loader";
import { useVonageSession } from "./vonage/use-vonage-session";
import { useVonagePublisher } from "./vonage/use-vonage-publisher";
import { useVonageSubscriber } from "./vonage/use-vonage-subscriber";
import { VonageCallOptions, VonageError } from "./vonage/types";
import { useVonageCallSession } from "./vonage/useVonageCallSession";
import { useVonageLocalMedia } from "./vonage/useVonageLocalMedia";

export function useVonageCall({
  publisherRef,
  subscriberRef,
  recipientId,
  conversationId = 'default'
}) {
  const scriptLoaded = useRef(false);

  const {
    session,
    isConnecting,
    isConnected,
    error,
    setError,
    setIsConnecting,
    setIsConnected,
    setSession,
    initializeSession,
    disconnect: disconnectSession
  } = useVonageSession({ conversationId, recipientId });

  const {
    publisher,
    initializePublisher,
    destroyPublisher,
    toggleAudio,
    toggleVideo
  } = useVonagePublisher({ 
    publisherRef,
    onError: setError
  });

  const {
    hasRemoteParticipant,
    handleStreamCreated,
    destroySubscriber
  } = useVonageSubscriber({ subscriberRef });

  const { connectSession, disconnectAll } = useVonageCallSession({
    conversationId,
    recipientId,
    initializePublisher,
    handleStreamCreated,
    destroyPublisher,
    destroySubscriber,
    setSession,
    setError,
    setIsConnecting,
    setIsConnected
  });

  const {
    isMicActive,
    isVideoActive,
    handleToggleAudio,
    handleToggleVideo
  } = useVonageLocalMedia(toggleAudio, toggleVideo);

  useEffect(() => {
    if (!scriptLoaded.current) {
      loadVonageScript()
        .then(() => { scriptLoaded.current = true; })
        .catch((err) => {
          setError({
            type: 'INITIALIZATION_ERROR',
            message: "Failed to load Vonage SDK: " + err.message,
            originalError: err
          });
        });
    }
    return () => {
      disconnectAll();
    };
  }, []);

  return {
    isConnecting,
    isConnected,
    hasRemoteParticipant,
    error,
    connect: connectSession,
    disconnect: disconnectAll,
    toggleAudio: handleToggleAudio,
    toggleVideo: handleToggleVideo,
    isMicActive,
    isVideoActive
  };
}
