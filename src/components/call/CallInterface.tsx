
import { IncomingCallDialog } from "@/components/call/IncomingCallDialog";
import { ActiveCallDialog } from "@/components/call/ActiveCallDialog";
import { CallProvider } from '@/components/call/store';
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useDeviceSetup } from '@/components/call/hooks/useDeviceSetup';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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
    // Only set up the browser environment if we have a userId and we're online
    if (!userId || !isOnline) {
      return;
    }
    
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
        toast.error('Failed to initialize call system');
      }
    }
  }, [userId, isOnline]);

  useEffect(() => {
    if (hasError && retryCounter < 3 && isOnline) {
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
  }, [hasError, retryCounter, isOnline, setupBrowserEnvironment]);

  // If no userId is provided or we're offline, don't render anything
  if (!userId || !isOnline) {
    return null;
  }

  if (hasError) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to initialize call system. Please refresh the page and try again.
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
