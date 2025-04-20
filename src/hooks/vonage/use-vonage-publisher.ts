
import { useRef, useCallback } from "react";
import { VonagePublisherOptions, VonageError } from "./types";

export function useVonagePublisher({ publisherElement, onError }: VonagePublisherOptions) {
  const publisherRef = useRef<any>(null);

  const initializePublisher = useCallback(() => {
    const publisherOptions = {
      insertMode: 'append',
      width: '100%',
      height: '100%',
      publishAudio: true,
      publishVideo: false,
    };

    publisherRef.current = window.OT.initPublisher(
      publisherElement,
      publisherOptions
    );

    publisherRef.current.on('error', (error: any) => {
      const vonageError: VonageError = {
        type: 'MEDIA_ACCESS_ERROR',
        message: "Could not access camera/microphone",
        originalError: error
      };
      console.error('Error initializing publisher:', error);
      onError(vonageError);
    });

    return publisherRef.current;
  }, [publisherElement, onError]);

  const destroyPublisher = useCallback(() => {
    if (publisherRef.current) {
      publisherRef.current.destroy();
      publisherRef.current = null;
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (publisherRef.current) {
      const hasAudio = publisherRef.current.getSettings().audioSource !== null;
      publisherRef.current.publishAudio(!hasAudio);
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (publisherRef.current) {
      const hasVideo = publisherRef.current.getSettings().videoSource !== null;
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
