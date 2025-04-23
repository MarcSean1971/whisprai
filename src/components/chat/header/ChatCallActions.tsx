
import { Button } from "@/components/ui/button";
import { Phone, Video } from "lucide-react";
import { toast } from "sonner";
import { useTwilioConnectionCheck } from "@/hooks/use-twilio-connection-check";
import { useState } from "react";

interface ChatCallActionsProps {
  isOnline: boolean;
  isCalling: boolean;
  onStartCall: (type: "audio" | "video") => void;
  recipientName: string;
}

export function ChatCallActions({ 
  isOnline, 
  isCalling, 
  onStartCall,
  recipientName 
}: ChatCallActionsProps) {
  const { checkConnection, isChecking } = useTwilioConnectionCheck();
  const [loadingType, setLoadingType] = useState<"audio" | "video" | null>(null);

  const handleCall = async (type: "audio" | "video") => {
    if (!isOnline) {
      toast.error(`${recipientName} is offline. Try again later.`);
      return;
    }
    
    if (isCalling) {
      toast.info("Already in a call");
      return;
    }

    setLoadingType(type);

    toast.info("Checking Twilio connection...");
    const ok = await checkConnection();
    setLoadingType(null);

    if (!ok) {
      toast.error("Unable to connect to Twilio. Please check your network or contact support.");
      return;
    }

    console.log(`[WebRTC] Starting ${type} call with ${recipientName}`);
    onStartCall(type);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        disabled={isCalling || !isOnline || isChecking || loadingType === "video"}
        title={`Video call ${recipientName}`}
        onClick={() => handleCall("video")}
      >
        {loadingType === "video"
          ? <span className="animate-spin w-5 h-5 border-2 border-t-transparent rounded-full border-primary" />
          : <Video className="h-5 w-5" />}
        <span className="sr-only">Video Call</span>
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        disabled={isCalling || !isOnline || isChecking || loadingType === "audio"}
        title={`Call ${recipientName}`}
        onClick={() => handleCall("audio")}
      >
        {loadingType === "audio"
          ? <span className="animate-spin w-5 h-5 border-2 border-t-transparent rounded-full border-primary" />
          : <Phone className="h-5 w-5" />}
        <span className="sr-only">Call</span>
      </Button>
    </div>
  );
}
