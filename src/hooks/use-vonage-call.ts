import { useVonageSession } from "./vonage/use-vonage-session";
import { useVonagePublisher } from "./vonage/use-vonage-publisher";
import { useVonageSubscriber } from "./vonage/use-vonage-subscriber";
import { useVonageCallSession } from "./vonage/useVonageCallSession";
import { useVonageLocalMedia } from "./vonage/useVonageLocalMedia";
import { useVonageScript } from "./vonage/useVonageScript";
import { VonageCallOptions } from "./vonage/types";

export function useVonageCall({
  publisherRef,
  subscriberRef,
  recipientId,
  conversationId = 'default'
}: VonageCallOptions) {
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

  useVonageScript(setError);

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
