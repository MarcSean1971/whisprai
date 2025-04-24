
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface VideoCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  userName?: string;
  recipientName?: string;
}

export function VideoCallDialog({ open, onOpenChange, roomId, userName, recipientName }: VideoCallDialogProps) {
  const isMobile = useIsMobile();
  const [iframeMounted, setIframeMounted] = useState(false);
  
  const userParams = new URLSearchParams({
    roomID: roomId || '',
    userName: userName || 'User',
    recipientName: recipientName || 'Recipient'
  }).toString();

  const updateCallStatus = useCallback(async () => {
    if (!roomId) return;
    
    try {
      const { error } = await supabase
        .from('video_call_invitations')
        .update({ status: 'ended' })
        .eq('room_id', roomId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update call status:', error);
      toast.error('Failed to end call properly');
    }
  }, [roomId]);

  const handleOpenChange = useCallback(async (newOpen: boolean) => {
    if (!newOpen) {
      await updateCallStatus();
      setIframeMounted(false);
    }
    onOpenChange(newOpen);
  }, [onOpenChange, updateCallStatus]);

  useEffect(() => {
    if (open && roomId) {
      setIframeMounted(true);
    }
  }, [open, roomId]);

  if (!roomId) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "bg-background/95 backdrop-blur-lg p-0 overflow-hidden",
          isMobile 
            ? "fixed inset-0 w-screen h-screen max-w-none max-h-none rounded-none border-0" 
            : "w-[1024px] h-[600px] max-w-[90vw] max-h-[80vh]"
        )}
        style={{
          transform: isMobile ? 'none' : undefined,
          margin: isMobile ? 0 : undefined,
          zIndex: isMobile ? 100 : undefined,
          paddingTop: isMobile ? 'env(safe-area-inset-top)' : undefined,
          paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : undefined,
          paddingLeft: isMobile ? 'env(safe-area-inset-left)' : undefined,
          paddingRight: isMobile ? 'env(safe-area-inset-right)' : undefined
        }}
        hideClose={true}
      >
        <DialogTitle className="sr-only">Video Call</DialogTitle>
        <DialogDescription className="sr-only">
          Video call with {recipientName}
        </DialogDescription>
        
        <div className="absolute right-4 top-4 z-50">
          <button
            onClick={() => handleOpenChange(false)}
            className="rounded-full p-2 bg-background/80 hover:bg-background/90 transition-colors"
            aria-label="Close video call"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="w-full h-full">
          <ErrorBoundary>
            {iframeMounted && (
              <iframe
                src={`/video-call.html?${userParams}`}
                title="Video Call"
                className="w-full h-full border-0"
                allow="camera; microphone; clipboard-write; display-capture"
              />
            )}
          </ErrorBoundary>
        </div>
      </DialogContent>
    </Dialog>
  );
}
