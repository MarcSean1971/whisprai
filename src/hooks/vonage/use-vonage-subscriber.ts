
import { useRef, useCallback, useState } from "react";
import { VonageSubscriberOptions } from "./types";

export function useVonageSubscriber({ subscriberRef }: VonageSubscriberOptions) {
  const subscriber = useRef<any>(null);
  const [hasRemoteParticipant, setHasRemoteParticipant] = useState(false);

  const handleStreamCreated = useCallback((session: any, event: any) => {
    console.log('[Vonage Subscriber] New stream created:', { streamId: event.stream.id });
    
    if (!subscriberRef.current) {
      console.error('[Vonage Subscriber] Subscriber ref not ready');
      return;
    }

    const subscribeOptions = {
      insertMode: 'append',
      width: '100%',
      height: '100%',
      subscribeToAudio: true,
      subscribeToVideo: true
    };

    try {
      subscriber.current = session.subscribe(
        event.stream,
        subscriberRef.current,
        subscribeOptions,
        (error: any) => {
          if (error) {
            console.error('[Vonage Subscriber] Subscription error:', error);
          } else {
            console.log('[Vonage Subscriber] Successfully subscribed to stream');
            setHasRemoteParticipant(true);
          }
        }
      );

      subscriber.current.on('destroyed', () => {
        console.log('[Vonage Subscriber] Remote stream destroyed');
        setHasRemoteParticipant(false);
      });

    } catch (error) {
      console.error('[Vonage Subscriber] Failed to subscribe to stream:', error);
    }
  }, [subscriberRef]);

  const destroySubscriber = useCallback(() => {
    if (subscriber.current) {
      console.log('[Vonage Subscriber] Destroying subscriber');
      subscriber.current.destroy();
      subscriber.current = null;
      setHasRemoteParticipant(false);
    }
  }, []);

  return {
    subscriber: subscriber.current,
    hasRemoteParticipant,
    handleStreamCreated,
    destroySubscriber
  };
}
