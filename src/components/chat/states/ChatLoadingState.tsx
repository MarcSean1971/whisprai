
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageSkeleton } from "@/components/chat/message/MessageSkeleton";

interface ChatLoadingStateProps {
  conversationId: string;
}

export function ChatLoadingState({ conversationId }: ChatLoadingStateProps) {
  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      <ChatHeader 
        conversationId={conversationId} 
        replyToMessageId={null}
        onCancelReply={() => {}}
      />
      <div className="flex-1 overflow-hidden relative pb-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] mt-[calc(4rem+env(safe-area-inset-top,0px))]">
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
          <MessageSkeleton />
          <MessageSkeleton />
          <MessageSkeleton />
        </div>
      </div>
    </div>
  );
}
