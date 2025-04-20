
import { useRef, useCallback, useState } from "react";
import { VonageSubscriberOptions } from "./types";

export function useVonageSubscriber({ subscriberElement }: VonageSubscriberOptions) {
  const subscriberRef = useRef<any>(null);
  const [hasRemoteParticipant, setHasRemoteParticipant] = useState(false);

  const handleStreamCreated = useCallback((session: any, event: any) => {
    console.log('[Vonage Subscriber] New stream created:', { streamId: event.stream.id });
    
    const subscribeOptions = {
      insertMode: 'append',
      width: '100%',
      height: '100%',
      appendTo: subscriberElement,
      subscribeToAudio: true,
      subscribeToVideo: true
    };

    try {
      subscriberRef.current = session.subscribe(
        event.stream,
        subscribeOptions
      );

      console.log('[Vonage Subscriber] Successfully subscribed to stream');

      subscriberRef.current.on('connected', () => {
        console.log('[Vonage Subscriber] Connected to remote stream');
        setHasRemoteParticipant(true);
      });

      subscriberRef.current.on('destroyed', () => {
        console.log('[Vonage Subscriber] Remote stream destroyed');
      });

      subscriberRef.current.on('error', (error: any) => {
        console.error('[Vonage Subscriber] Subscription error:', error);
      });
    } catch (error) {
      console.error('[Vonage Subscriber] Failed to subscribe to stream:', error);
    }
  }, [subscriberElement]);

  const destroySubscriber = useCallback(() => {
    if (subscriberRef.current) {
      console.log('[Vonage Subscriber] Destroying subscriber');
      subscriberRef.current = null;
      setHasRemoteParticipant(false);
    }
  }, []);

  return {
    subscriber: subscriberRef.current,
    hasRemoteParticipant,
    handleStreamCreated,
    destroySubscriber
  };
}
