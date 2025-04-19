
import { IncomingCallDialog } from "@/components/call/IncomingCallDialog";
import { ActiveCallDialog } from "@/components/call/ActiveCallDialog";
import { CallProvider } from '@/components/call/store';
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface CallInterfaceProps {
  userId: string;
}

export function CallInterface({ userId }: CallInterfaceProps) {
  const [hasError, setHasError] = useState(false);
  const [retryCounter, setRetryCounter] = useState(0);

  useEffect(() => {
    // Add a global error handler for Twilio client errors
    const handleError = (event: ErrorEvent) => {
      // Only handle errors from Twilio-related code
      if (event.message.includes('twilio') || 
          event.filename?.includes('twilio') ||
          event.message.includes('Object prototype may only be an Object or null')) {
        console.error('Twilio error caught:', event);
        setHasError(true);
        toast.error('Communication service error. Please try again later.');
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  // Auto-retry initialization after a delay if there was an error
  useEffect(() => {
    if (hasError && retryCounter < 2) {
      const timer = setTimeout(() => {
        console.log('Attempting to recover from Twilio error...');
        setHasError(false);
        setRetryCounter(prev => prev + 1);
      }, 5000); // Wait 5 seconds before retry
      
      return () => clearTimeout(timer);
    }
  }, [hasError, retryCounter]);

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
