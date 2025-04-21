
import { useRef, useCallback, useState } from "react";
import { VonageSubscriberOptions } from "./types";

export function useVonageSubscriber({ subscriberRef }: VonageSubscriberOptions) {
  const subscriber = useRef<any>(null);
  const [hasRemoteParticipant, setHasRemoteParticipant] = useState(false);
  const subscriberId = useRef<string>(`vonage-subscriber-${Date.now()}`);

  const handleStreamCreated = useCallback((session: any, event: any) => {
    console.log('[Vonage Subscriber] New stream created:', { streamId: event.stream.id });
    
    if (!subscriberRef.current) {
      console.error('[Vonage Subscriber] Subscriber ref not ready');
      return;
    }

    // Clean up any existing subscriber first
    destroySubscriber();

    try {
      // Clean any existing content and set ID
      while (subscriberRef.current.firstChild) {
        subscriberRef.current.removeChild(subscriberRef.current.firstChild);
      }
      subscriberRef.current.id = subscriberId.current;
      
      const subscribeOptions = {
        insertMode: 'append',
        width: '100%',
        height: '100%',
        subscribeToAudio: true,
        subscribeToVideo: true,
        style: {
          buttonDisplayMode: 'off',
          nameDisplayMode: 'off',
          audioLevelDisplayMode: 'off'
        }
      };

      console.log('[Vonage Subscriber] Subscribing to stream with options:', subscribeOptions);
      
      subscriber.current = session.subscribe(
        event.stream,
        subscriberId.current,
        subscribeOptions,
        (error: any) => {
          if (error) {
            console.error('[Vonage Subscriber] Subscription error:', error);
            setHasRemoteParticipant(false);
          } else {
            console.log('[Vonage Subscriber] Successfully subscribed to stream');
            setHasRemoteParticipant(true);
          }
        }
      );

      // Set up event handlers
      subscriber.current.on('videoEnabled', () => {
        console.log('[Vonage Subscriber] Remote video enabled');
      });

      subscriber.current.on('videoDisabled', () => {
        console.log('[Vonage Subscriber] Remote video disabled');
      });

      subscriber.current.on('destroyed', () => {
        console.log('[Vonage Subscriber] Remote stream destroyed');
        setHasRemoteParticipant(false);
      });

    } catch (error) {
      console.error('[Vonage Subscriber] Failed to subscribe to stream:', error);
      setHasRemoteParticipant(false);
    }
  }, [subscriberRef]);

  const destroySubscriber = useCallback(() => {
    if (subscriber.current) {
      console.log('[Vonage Subscriber] Destroying subscriber');
      try {
        subscriber.current.destroy();
      } catch (error) {
        console.error('[Vonage Subscriber] Error destroying subscriber:', error);
      } finally {
        subscriber.current = null;
        setHasRemoteParticipant(false);
      }
    }
  }, []);

  return {
    subscriber: subscriber.current,
    hasRemoteParticipant,
    handleStreamCreated,
    destroySubscriber
  };
}
