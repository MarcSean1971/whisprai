
import { IncomingCallDialog } from "@/components/call/IncomingCallDialog";
import { ActiveCallDialog } from "@/components/call/ActiveCallDialog";
import { CallProvider } from '@/components/call/store';
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useDeviceSetup } from '@/components/call/hooks/useDeviceSetup';

interface CallInterfaceProps {
  userId: string;
}

export function CallInterface({ userId }: CallInterfaceProps) {
  const [hasError, setHasError] = useState(false);
  const [retryCounter, setRetryCounter] = useState(0);
  const { setupPolyfills } = useDeviceSetup();

  // Run setupPolyfills on module load (outside of any effects)
  // This ensures it runs before any Twilio code is initialized
  try {
    setupPolyfills();
  } catch (error) {
    console.error('Failed to setup polyfills on load:', error);
  }

  useEffect(() => {
    // Set up global error handler for Twilio client errors
    const handleError = (event: ErrorEvent) => {
      // Only handle errors from Twilio-related code or prototype errors
      if (event.message.includes('twilio') || 
          event.filename?.includes('twilio') ||
          event.message.includes('Object prototype may only be an Object or null') ||
          event.message.includes('events.EventEmitter')) {
        console.error('Twilio error caught:', event);
        setHasError(true);
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
        setHasError(false);
        setRetryCounter(prev => prev + 1);
        
        // Try to re-initialize polyfills
        try {
          setupPolyfills();
        } catch (error) {
          console.error('Failed to re-setup polyfills on retry:', error);
        }
      }, 5000); // Wait 5 seconds before retry
      
      return () => clearTimeout(timer);
    }
  }, [hasError, retryCounter, setupPolyfills]);

  if (hasError) {
    return null; // Don't render the call components when there's an error
  }

  return (
    <CallProvider userId={userId}>
      <IncomingCallDialog />
      <ActiveCallDialog />
    </CallProvider>
  );
}
