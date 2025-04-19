
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
  const errorHandlerRef = useRef<(event: ErrorEvent) => void>();

  // Initialize polyfills immediately on component mount
  // Do this BEFORE any Twilio code executes
  useEffect(() => {
    if (!polyfillAttemptRef.current) {
      polyfillAttemptRef.current = true;
      try {
        console.log('Setting up polyfills');
        setupPolyfills();
        setPolyfillsSetup(true);
        console.log('Polyfills successfully set up');
      } catch (error) {
        console.error('Failed to setup polyfills on first attempt:', error);
        setHasError(true);
      }
    }
  }, []);

  // Set up global error handler for Twilio client errors
  useEffect(() => {
    // Create a handler function that we can reference for cleanup
    const handleError = (event: ErrorEvent) => {
      // Capture errors related to Twilio or our known issues
      if (event.message.includes('twilio') || 
          event.filename?.includes('twilio') ||
          event.message.includes('Object prototype may only be an Object or null') ||
          event.message.includes('events.EventEmitter')) {
        
        console.error('Twilio error caught:', event.message, event);
        setHasError(true);
        
        // Prevent default to try to keep our app running despite the error
        event.preventDefault();
        
        // Only show toast once to avoid spam
        if (!hasError) {
          toast.error('Communication service error. We\'ll try to recover automatically.');
        }
      }
    };

    // Store the handler reference for cleanup
    errorHandlerRef.current = handleError;
    
    window.addEventListener('error', handleError);
    
    return () => {
      if (errorHandlerRef.current) {
        window.removeEventListener('error', errorHandlerRef.current);
      }
    };
  }, [hasError]);

  // Auto-retry initialization after a delay if there was an error
  useEffect(() => {
    if (hasError && retryCounter < 3) {
      const timer = setTimeout(() => {
        console.log(`Attempting to recover from Twilio error (attempt ${retryCounter + 1}/3)...`);
        
        // Attempt to re-initialize polyfills
        try {
          setupPolyfills();
          setPolyfillsSetup(true);
          setHasError(false);
          console.log('Polyfills re-initialized on retry');
        } catch (error) {
          console.error(`Failed to re-setup polyfills on retry ${retryCounter + 1}:`, error);
        }
        
        setRetryCounter(prev => prev + 1);
      }, 2000 + (retryCounter * 1000)); // Increase delay with each retry
      
      return () => clearTimeout(timer);
    } else if (hasError && retryCounter >= 3) {
      toast.error('Unable to initialize call service. Please refresh the page.');
    }
  }, [hasError, retryCounter, setupPolyfills]);

  // Only render the call components when polyfills are set up and we don't have errors
  if (hasError) {
    // Show UI for error state but still allow retry
    return null; 
  }

  if (!polyfillsSetup) {
    // Don't render anything while polyfills are being setup
    return null;
  }

  return (
    <CallProvider userId={userId}>
      <IncomingCallDialog />
      <ActiveCallDialog />
    </CallProvider>
  );
}
