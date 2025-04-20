
import { useRef, useCallback } from "react";

interface UseVonagePublisherProps {
  publisherElement: string;
  onError: (error: string) => void;
}

export function useVonagePublisher({ publisherElement, onError }: UseVonagePublisherProps) {
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
      console.error('Error initializing publisher:', error);
      onError("Could not access camera/microphone");
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
