
import { IncomingCallDialog } from "@/components/call/IncomingCallDialog";
import { ActiveCallDialog } from "@/components/call/ActiveCallDialog";
import { CallProvider } from '@/components/call/store';
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useDeviceSetup } from '@/components/call/hooks/useDeviceSetup';

interface CallInterfaceProps {
  userId: string;
}

export function CallInterface({ userId }: CallInterfaceProps) {
  const [hasError, setHasError] = useState(false);
  const [retryCounter, setRetryCounter] = useState(0);
  const [polyfillsSetup, setPolyfillsSetup] = useState(false);
  const { setupPolyfills } = useDeviceSetup();
  const polyfillAttemptRef = useRef(false);

  // Initialize polyfills immediately on component mount
  useEffect(() => {
    if (!polyfillAttemptRef.current) {
      polyfillAttemptRef.current = true;
      
      // Wrap in try-catch to handle any initialization errors
      try {
        console.log('Setting up polyfills for Twilio');
        setupPolyfills();
        setPolyfillsSetup(true);
        console.log('Polyfills successfully initialized');
      } catch (error) {
        console.error('Failed to setup polyfills:', error);
        setHasError(true);
      }
    }

    // Cleanup function to help with potential memory leaks
    return () => {
      if (window.events && window.events.EventEmitter) {
        // Clean up any remaining listeners
        const emitter = new window.events.EventEmitter();
        emitter.removeAllListeners();
      }
    };
  }, []);

  // Auto-retry initialization after a delay if there was an error
  useEffect(() => {
    if (hasError && retryCounter < 3) {
      const retryDelay = 2000 + (retryCounter * 1000); // Incremental backoff
      console.log(`Scheduling retry attempt ${retryCounter + 1}/3 in ${retryDelay}ms`);
      
      const timer = setTimeout(() => {
        console.log(`Attempting recovery (attempt ${retryCounter + 1}/3)...`);
        
        try {
          setupPolyfills();
          setPolyfillsSetup(true);
          setHasError(false);
          console.log('Successfully recovered on retry');
        } catch (error) {
          console.error(`Recovery attempt ${retryCounter + 1} failed:`, error);
          setRetryCounter(prev => prev + 1);
        }
      }, retryDelay);
      
      return () => clearTimeout(timer);
    } else if (hasError && retryCounter >= 3) {
      console.error('Max retry attempts reached');
      toast.error('Unable to initialize call service. Please refresh the page.');
    }
  }, [hasError, retryCounter, setupPolyfills]);

  // Only render call components when polyfills are properly initialized
  if (hasError || !polyfillsSetup) {
    return null;
  }

  return (
    <CallProvider userId={userId}>
      <IncomingCallDialog />
      <ActiveCallDialog />
    </CallProvider>
  );
}
