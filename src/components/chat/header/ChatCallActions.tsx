import { Button } from "@/components/ui/button";
import { Phone, Video } from "lucide-react";
import { toast } from "sonner";

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
  const handleCall = (type: "audio" | "video") => {
    if (!isOnline) {
      toast.error("Recipient is offline");
      return;
    }
    onStartCall(type);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        disabled={isCalling || !isOnline}
        title={`Video call ${recipientName}`}
        onClick={() => handleCall("video")}
      >
        <Video className="h-5 w-5" />
        <span className="sr-only">Video Call</span>
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        disabled={isCalling || !isOnline}
        title={`Call ${recipientName}`}
        onClick={() => handleCall("audio")}
      >
        <Phone className="h-5 w-5" />
        <span className="sr-only">Call</span>
      </Button>
    </div>
  );
}
