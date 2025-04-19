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
  // Do this BEFORE any Twilio code executes
  useEffect(() => {
    if (!polyfillAttemptRef.current) {
      polyfillAttemptRef.current = true;
      try {
        // Call setupPolyfills right away
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
    // Set up global error handler for Twilio client errors
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
          toast.error('Communication service error. Please refresh the page if issues persist.');
        }
      }
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, [hasError]);

  // Auto-retry initialization after a delay if there was an error
  useEffect(() => {
    if (hasError && retryCounter < 2) {
      const timer = setTimeout(() => {
        console.log('Attempting to recover from Twilio error...');
        
        // Attempt to re-initialize polyfills
        try {
          setupPolyfills();
          setPolyfillsSetup(true);
          console.log('Polyfills re-initialized on retry');
          setHasError(false);
        } catch (error) {
          console.error('Failed to re-setup polyfills on retry:', error);
        }
        
        setRetryCounter(prev => prev + 1);
      }, 3000); // Wait 3 seconds before retry
      
      return () => clearTimeout(timer);
    }
  }, [hasError, retryCounter, setupPolyfills]);

  // Only render the call components when polyfills are set up and we don't have errors
  if (hasError || !polyfillsSetup) {
    return null; // Don't render the call components when there's an error or polyfills aren't ready
  }

  return (
    <CallProvider userId={userId}>
      <IncomingCallDialog />
      <ActiveCallDialog />
    </CallProvider>
  );
}
