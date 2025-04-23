
import { EmptyState } from "@/components/EmptyState";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatHeader } from "@/components/chat/ChatHeader";

interface ChatErrorStateProps {
  error: Error;
  conversationId: string;
  replyToMessageId: string | null;
  onCancelReply: () => void;
  onRetry: () => void;
}

export function ChatErrorState({ 
  error, 
  conversationId, 
  replyToMessageId,
  onCancelReply,
  onRetry 
}: ChatErrorStateProps) {
  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      <ChatHeader 
        conversationId={conversationId} 
        replyToMessageId={replyToMessageId}
        onCancelReply={onCancelReply}
      />
      <div className="flex-1 overflow-hidden relative pb-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] mt-[calc(4rem+env(safe-area-inset-top,0px))]">
        <EmptyState
          icon={<AlertCircle className="h-10 w-10 text-destructive" />}
          title="Error loading chat"
          description={error?.message || "Failed to load the chat. Please try again."}
          action={
            <Button onClick={onRetry} variant="outline">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Retry
            </Button>
          }
          className="absolute inset-0 flex items-center justify-center"
        />
      </div>
    </div>
  );
}
