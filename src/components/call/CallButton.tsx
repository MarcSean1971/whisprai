
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useProfile } from "@/hooks/use-profile";
import { useCallStore } from '@/components/call/store';

interface CallButtonProps {
  recipientId: string;
  recipientName?: string;
  className?: string;
  disabled?: boolean;
}

export function CallButton({ 
  recipientId,
  recipientName,
  className,
  disabled = false
}: CallButtonProps) {
  const { profile } = useProfile();
  const { initiateCall } = useCallStore();
  const [isCallInProgress, setIsCallInProgress] = useState(false);

  const handleCallClick = useCallback(() => {
    if (!profile) {
      toast.error("You must be logged in to make calls");
      return;
    }

    if (!recipientId) {
      toast.error("No recipient specified for call");
      return;
    }

    // Prevent multiple rapid call attempts
    if (isCallInProgress) {
      return;
    }

    setIsCallInProgress(true);
    
    try {
      initiateCall(recipientId, recipientName);
      toast.info(`Calling ${recipientName || recipientId}...`);
    } catch (error) {
      console.error("Error initiating call:", error);
      toast.error("Failed to start call. Please try again.");
    }

    // Reset the call in progress flag after a delay
    setTimeout(() => {
      setIsCallInProgress(false);
    }, 2000);
  }, [profile, recipientId, recipientName, initiateCall, isCallInProgress]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={handleCallClick}
      disabled={disabled || !profile || isCallInProgress}
      title={`Call ${recipientName || recipientId}`}
    >
      <Phone className="h-5 w-5" />
      <span className="sr-only">Call</span>
    </Button>
  );
}
