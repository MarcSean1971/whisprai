
import { IncomingCallDialog } from "@/components/call/IncomingCallDialog";
import { ActiveCallDialog } from "@/components/call/ActiveCallDialog";
import { CallProvider } from "@/components/call/store/useCallStore";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface CallInterfaceProps {
  userId: string;
}

export function CallInterface({ userId }: CallInterfaceProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Add a global error handler for Twilio client errors
    const handleError = (event: ErrorEvent) => {
      if (event.message.includes('twilio') || event.filename?.includes('twilio')) {
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

  if (hasError) {
    return null;
  }

  return (
    <CallProvider userId={userId}>
      <IncomingCallDialog />
      <ActiveCallDialog />
    </CallProvider>
  );
}
