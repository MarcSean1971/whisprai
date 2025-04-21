
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

    if (publisher.current) {
      console.log('[Vonage Publisher] Reusing existing publisher');
      return publisher.current;
    }

    try {
      // Clean up any existing publisher element
      while (publisherRef.current.firstChild) {
        publisherRef.current.removeChild(publisherRef.current.firstChild);
      }
      
      // No need to set id; we use the DOM node directly

      const publisherOptions = {
        insertMode: 'append',
        width: '100%',
        height: '100%',
        publishAudio: true,
        publishVideo: false,
        audioSource: true, // explicitly enable audio
        videoSource: null, // initially no video
        style: {
          buttonDisplayMode: 'off', // Hide OpenTok's default UI controls
          nameDisplayMode: 'off'
        }
      };
      
      console.log('[Vonage Publisher] Creating publisher with options:', publisherOptions);
      
      // Only pass publisherRef.current and publisherOptions to initPublisher
      publisher.current = window.OT.initPublisher(
        publisherRef.current, 
        publisherOptions
      );

      // Set up event listeners for errors
      publisher.current.on('streamCreated', (event: any) => {
        console.log('[Vonage Publisher] Local stream created:', event);
      });

      publisher.current.on('streamDestroyed', (event: any) => {
        console.log('[Vonage Publisher] Local stream destroyed:', event);
      });

      publisher.current.on('accessAllowed', () => {
        console.log('[Vonage Publisher] Media access allowed');
      });

      publisher.current.on('accessDenied', (error: any) => {
        console.error('[Vonage Publisher] Media access denied:', error);
        const vonageError: VonageError = {
          type: 'MEDIA_ACCESS_ERROR',
          message: "Media access denied: " + error.message,
          originalError: error
        };
        onError(vonageError);
      });

      publisher.current.on('error', (error: any) => {
        console.error('[Vonage Publisher] Publisher error:', error);
        const vonageError: VonageError = {
          type: 'PUBLISH_ERROR',
          message: "Error in publisher: " + error.message,
          originalError: error
        };
        onError(vonageError);
      });

      return publisher.current;
    } catch (error: any) {
      const vonageError: VonageError = {
        type: 'PUBLISH_ERROR',
        message: "Failed to initialize publisher: " + error.message,
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
      try {
        publisher.current.destroy();
      } catch (error) {
        console.error('[Vonage Publisher] Error destroying publisher:', error);
      } finally {
        publisher.current = null;
      }
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (publisher.current) {
      try {
        const hasAudio = publisher.current.getAudioSource() !== null;
        console.log('[Vonage Publisher] Toggling audio:', { currentState: hasAudio, newState: !hasAudio });
        publisher.current.publishAudio(!hasAudio);
        return !hasAudio;
      } catch (error) {
        console.error('[Vonage Publisher] Error toggling audio:', error);
        return false;
      }
    }
    return false;
  }, []);

  const toggleVideo = useCallback(() => {
    if (publisher.current) {
      try {
        const hasVideo = publisher.current.getVideoSource() !== null;
        console.log('[Vonage Publisher] Toggling video:', { currentState: hasVideo, newState: !hasVideo });
        publisher.current.publishVideo(!hasVideo);
        return !hasVideo;
      } catch (error) {
        console.error('[Vonage Publisher] Error toggling video:', error);
        return false;
      }
    }
    return false;
  }, []);

  return {
    publisher: publisher.current,
    initializePublisher,
    destroyPublisher,
    toggleAudio,
    toggleVideo
  };
}
