
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallback } from "react";
import { toast } from "sonner";
import { useProfile } from "@/hooks/use-profile";
import { useCallStore } from "@/components/call/store/useCallStore";

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

  const handleCallClick = useCallback(() => {
    if (!profile) {
      toast.error("You must be logged in to make calls");
      return;
    }

    if (!recipientId) {
      toast.error("No recipient specified for call");
      return;
    }

    initiateCall(recipientId, recipientName);
    toast.info(`Calling ${recipientName || recipientId}...`);
  }, [profile, recipientId, recipientName, initiateCall]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={handleCallClick}
      disabled={disabled || !profile}
      title={`Call ${recipientName || recipientId}`}
    >
      <Phone className="h-5 w-5" />
      <span className="sr-only">Call</span>
    </Button>
  );
}
