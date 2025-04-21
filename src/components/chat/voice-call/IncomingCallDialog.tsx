
import { useState } from "react";
import { toast } from "sonner";
import { Phone, PhoneOff } from "lucide-react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ActiveCall } from "@/hooks/use-active-calls";
import { useProfile } from "@/hooks/use-profile";

interface IncomingCallDialogProps {
  call: ActiveCall | null;
  onAccept: (callId: string) => Promise<boolean>;
  onReject: (callId: string) => Promise<boolean>;
  callerName: string;
}

export function IncomingCallDialog({
  call,
  onAccept,
  onReject,
  callerName
}: IncomingCallDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAcceptCall = async () => {
    if (!call) return;
    setIsLoading(true);
    try {
      const result = await onAccept(call.id);
      if (!result) {
        toast.error("Failed to accept call");
      }
    } catch (error) {
      console.error("Error accepting call:", error);
      toast.error("Failed to accept call");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectCall = async () => {
    if (!call) return;
    setIsLoading(true);
    try {
      await onReject(call.id);
    } catch (error) {
      console.error("Error rejecting call:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add audio element for ringtone
  const ringtoneSrc = "/sounds/ringtone.mp3";

  return (
    <AlertDialog open={!!call}>
      <AlertDialogContent className="max-w-md animate-pulse">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center">
            Incoming Call
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {callerName} is calling you
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex justify-center my-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <Phone className="h-8 w-8 text-primary" />
          </div>
        </div>

        <AlertDialogFooter className="flex justify-center gap-4 sm:justify-center">
          <Button
            variant="destructive"
            size="lg"
            className="rounded-full"
            onClick={handleRejectCall}
            disabled={isLoading}
          >
            <PhoneOff className="mr-2 h-4 w-4" />
            Decline
          </Button>
          <Button
            variant="default"
            size="lg"
            className="rounded-full bg-green-600 hover:bg-green-700"
            onClick={handleAcceptCall}
            disabled={isLoading}
          >
            <Phone className="mr-2 h-4 w-4" />
            Accept
          </Button>
        </AlertDialogFooter>

        <audio src={ringtoneSrc} autoPlay loop />
      </AlertDialogContent>
    </AlertDialog>
  );
}
