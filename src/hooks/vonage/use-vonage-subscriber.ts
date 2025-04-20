
import { useRef, useCallback, useState } from "react";
import { VonageSubscriberOptions } from "./types";

export function useVonageSubscriber({ subscriberElement }: VonageSubscriberOptions) {
  const subscriberRef = useRef<any>(null);
  const [hasRemoteParticipant, setHasRemoteParticipant] = useState(false);

  const handleStreamCreated = useCallback((session: any, event: any) => {
    const subscribeOptions = {
      insertMode: 'append',
      width: '100%',
      height: '100%',
      appendTo: subscriberElement,
      subscribeToAudio: true,
      subscribeToVideo: true
    };

    subscriberRef.current = session.subscribe(
      event.stream,
      subscribeOptions
    );

    subscriberRef.current.on('connected', () => {
      setHasRemoteParticipant(true);
    });

    subscriberRef.current.on('destroyed', () => {
      console.log('Subscriber destroyed');
    });

    subscriberRef.current.on('error', (error: any) => {
      console.error('Error subscribing to stream:', error);
    });
  }, [subscriberElement]);

  const destroySubscriber = useCallback(() => {
    if (subscriberRef.current) {
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
