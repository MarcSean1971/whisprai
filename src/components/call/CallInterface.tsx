
import { IncomingCallDialog } from "@/components/call/IncomingCallDialog";
import { ActiveCallDialog } from "@/components/call/ActiveCallDialog";
import { CallProvider } from '@/components/call/store';
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useDeviceSetup } from '@/components/call/hooks/useDeviceSetup';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CallInterfaceProps {
  userId: string | null;
}

export function CallInterface({ userId }: CallInterfaceProps) {
  const [hasError, setHasError] = useState(false);
  const [retryCounter, setRetryCounter] = useState(0);
  const [polyfillsSetup, setPolyfillsSetup] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { setupBrowserEnvironment } = useDeviceSetup();
  const setupAttemptRef = useRef(false);
  const recoveryTimerRef = useRef<number | null>(null);
  const maxRetries = 3;

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network is online');
      setIsOnline(true);
      // Reset error state to allow for reconnection attempt
      if (hasError) {
        setHasError(false);
        setRetryCounter(0);
      }
    };

    const handleOffline = () => {
      console.log('Network is offline');
      setIsOnline(false);
      toast.error('Network connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [hasError]);

  useEffect(() => {
    if (!userId || !isOnline) {
      return;
    }
    
    if (!setupAttemptRef.current) {
      setupAttemptRef.current = true;
      
      const initializeEnvironment = async () => {
        try {
          console.log('Setting up Twilio browser environment');
          setupBrowserEnvironment();
          setPolyfillsSetup(true);
          console.log('Browser environment successfully initialized');
        } catch (error) {
          console.error('Failed to setup browser environment:', error);
          setHasError(true);
          toast.error('Failed to initialize call system');
        }
      };

      initializeEnvironment();
    }
  }, [userId, isOnline, setupBrowserEnvironment]);

  // Automatic retry logic
  useEffect(() => {
    if (hasError && retryCounter < maxRetries && isOnline) {
      const retryDelay = (2000 + (retryCounter * 1000)); // Incremental backoff
      console.log(`Scheduling retry attempt ${retryCounter + 1}/${maxRetries} in ${retryDelay}ms`);
      
      if (recoveryTimerRef.current) {
        window.clearTimeout(recoveryTimerRef.current);
      }
      
      recoveryTimerRef.current = window.setTimeout(() => {
        console.log(`Attempting recovery (attempt ${retryCounter + 1}/${maxRetries})...`);
        
        try {
          setupBrowserEnvironment();
          setPolyfillsSetup(true);
          setHasError(false);
          console.log('Successfully recovered on retry');
        } catch (error) {
          console.error(`Recovery attempt ${retryCounter + 1} failed:`, error);
          setRetryCounter(prev => prev + 1);
          if (retryCounter + 1 >= maxRetries) {
            toast.error('Could not initialize call system. Please try again later.');
          }
        }
      }, retryDelay);
      
      return () => {
        if (recoveryTimerRef.current) {
          window.clearTimeout(recoveryTimerRef.current);
          recoveryTimerRef.current = null;
        }
      };
    }
  }, [hasError, retryCounter, isOnline, setupBrowserEnvironment, maxRetries]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recoveryTimerRef.current) {
        window.clearTimeout(recoveryTimerRef.current);
        recoveryTimerRef.current = null;
      }
    };
  }, []);

  const handleManualRetry = () => {
    if (retryCounter >= maxRetries) {
      setRetryCounter(0);
      setHasError(false);
      setupAttemptRef.current = false;
      toast.info('Retrying connection...');
    }
  };

  // If no userId is provided or we're offline, don't render anything
  if (!userId || !isOnline) {
    return null;
  }

  if (hasError) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex flex-col gap-2">
          <span>Failed to initialize call system.</span>
          {retryCounter >= maxRetries && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleManualRetry}
              className="self-start"
            >
              Retry Connection
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (!polyfillsSetup) {
    return null;
  }

  return (
    <CallProvider userId={userId}>
      <IncomingCallDialog />
      <ActiveCallDialog />
    </CallProvider>
  );
}
