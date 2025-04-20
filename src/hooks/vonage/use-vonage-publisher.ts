
import { useRef, useCallback } from "react";
import { VonagePublisherOptions, VonageError } from "./types";

export function useVonagePublisher({ publisherElement, onError }: VonagePublisherOptions) {
  const publisherRef = useRef<any>(null);

  const initializePublisher = useCallback(() => {
    console.log('[Vonage Publisher] Initializing publisher...', { publisherElement });
    
    const publisherOptions = {
      insertMode: 'append',
      width: '100%',
      height: '100%',
      publishAudio: true,
      publishVideo: false,
    };

    try {
      publisherRef.current = window.OT.initPublisher(
        publisherElement,
        publisherOptions
      );

      console.log('[Vonage Publisher] Publisher initialized successfully');

      publisherRef.current.on('streamCreated', () => {
        console.log('[Vonage Publisher] Local stream created');
      });

      publisherRef.current.on('streamDestroyed', () => {
        console.log('[Vonage Publisher] Local stream destroyed');
      });

      publisherRef.current.on('error', (error: any) => {
        const vonageError: VonageError = {
          type: 'MEDIA_ACCESS_ERROR',
          message: "Could not access camera/microphone",
          originalError: error
        };
        console.error('[Vonage Publisher] Error:', vonageError);
        onError(vonageError);
      });

      return publisherRef.current;
    } catch (error: any) {
      const vonageError: VonageError = {
        type: 'PUBLISH_ERROR',
        message: "Failed to initialize publisher",
        originalError: error
      };
      console.error('[Vonage Publisher] Initialization error:', vonageError);
      onError(vonageError);
      return null;
    }
  }, [publisherElement, onError]);

  const destroyPublisher = useCallback(() => {
    if (publisherRef.current) {
      console.log('[Vonage Publisher] Destroying publisher');
      publisherRef.current.destroy();
      publisherRef.current = null;
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (publisherRef.current) {
      const hasAudio = publisherRef.current.getSettings().audioSource !== null;
      console.log('[Vonage Publisher] Toggling audio:', { currentState: hasAudio, newState: !hasAudio });
      publisherRef.current.publishAudio(!hasAudio);
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (publisherRef.current) {
      const hasVideo = publisherRef.current.getSettings().videoSource !== null;
      console.log('[Vonage Publisher] Toggling video:', { currentState: hasVideo, newState: !hasVideo });
      publisherRef.current.publishVideo(!hasVideo);
    }
  }, []);

  return {
    publisher: publisherRef.current,
    initializePublisher,
    destroyPublisher,
    toggleAudio,
    toggleVideo
  };
}
