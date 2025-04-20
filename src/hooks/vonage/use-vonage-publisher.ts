
import { useRef, useCallback } from "react";
import { VonagePublisherOptions, VonageError } from "./types";

export function useVonagePublisher({ publisherRef, onError }: VonagePublisherOptions) {
  const publisher = useRef<any>(null);

  const initializePublisher = useCallback(() => {
    console.log('[Vonage Publisher] Initializing publisher...', { publisherRef: publisherRef.current });
    
    if (!publisherRef.current) {
      console.error('[Vonage Publisher] Publisher ref not ready');
      return null;
    }

    const publisherOptions = {
      insertMode: 'append',
      width: '100%',
      height: '100%',
      publishAudio: true,
      publishVideo: false,
    };

    try {
      // Fix: Using the element ID or passing the DOM element directly
      // The Vonage SDK supports either a DOM element ID (string) or the DOM element itself
      publisher.current = window.OT.initPublisher(
        publisherRef.current, 
        publisherOptions
      );

      publisher.current.on('streamCreated', (event: any) => {
        console.log('[Vonage Publisher] Local stream created:', event);
      });

      publisher.current.on('streamDestroyed', (event: any) => {
        console.log('[Vonage Publisher] Local stream destroyed:', event);
      });

      // Separate error handling
      publisher.current.on('error', (error: any) => {
        console.error('[Vonage Publisher] Initialization error:', error);
        const vonageError: VonageError = {
          type: 'PUBLISH_ERROR',
          message: "Failed to initialize publisher: " + error.message,
          originalError: error
        };
        onError(vonageError);
      });

      return publisher.current;
    } catch (error: any) {
      const vonageError: VonageError = {
        type: 'PUBLISH_ERROR',
        message: "Failed to initialize publisher",
        originalError: error
      };
      console.error('[Vonage Publisher] Setup error:', vonageError);
      onError(vonageError);
      return null;
    }
  }, [publisherRef, onError]);

  const destroyPublisher = useCallback(() => {
    if (publisher.current) {
      console.log('[Vonage Publisher] Destroying publisher');
      publisher.current.destroy();
      publisher.current = null;
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (publisher.current) {
      const hasAudio = publisher.current.getSettings().audioSource !== null;
      console.log('[Vonage Publisher] Toggling audio:', { currentState: hasAudio, newState: !hasAudio });
      publisher.current.publishAudio(!hasAudio);
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (publisher.current) {
      const hasVideo = publisher.current.getSettings().videoSource !== null;
      console.log('[Vonage Publisher] Toggling video:', { currentState: hasVideo, newState: !hasVideo });
      publisher.current.publishVideo(!hasVideo);
    }
  }, []);

  return {
    publisher: publisher.current,
    initializePublisher,
    destroyPublisher,
    toggleAudio,
    toggleVideo
  };
}
