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
  const { setupBrowserEnvironment } = useDeviceSetup();
  const setupAttemptRef = useRef(false);

  useEffect(() => {
    if (!setupAttemptRef.current) {
      setupAttemptRef.current = true;
      
      try {
        console.log('Setting up Twilio browser environment');
        setupBrowserEnvironment();
        setPolyfillsSetup(true);
        console.log('Browser environment successfully initialized');
      } catch (error) {
        console.error('Failed to setup browser environment:', error);
        setHasError(true);
      }
    }

    return () => {
      if (window.events && typeof window.events.EventEmitter === 'function') {
        try {
          const emitter = new window.events.EventEmitter();
          emitter.removeAllListeners();
        } catch (err) {
          console.error('Error during cleanup:', err);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (hasError && retryCounter < 3) {
      const retryDelay = 2000 + (retryCounter * 1000); // Incremental backoff
      console.log(`Scheduling retry attempt ${retryCounter + 1}/3 in ${retryDelay}ms`);
      
      const timer = setTimeout(() => {
        console.log(`Attempting recovery (attempt ${retryCounter + 1}/3)...`);
        
        try {
          setupBrowserEnvironment();
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
  }, [hasError, retryCounter, setupBrowserEnvironment]);

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
