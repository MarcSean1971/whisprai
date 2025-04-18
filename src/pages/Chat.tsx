
import { useParams } from "react-router-dom";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { useMessages } from "@/hooks/use-messages";
import { useProfile } from "@/hooks/use-profile";
import { useChat } from "@/hooks/use-chat";

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const { data: messages, isLoading } = useMessages(id!);
  const { profile } = useProfile();
  const { sendMessage, handleVoiceRecord } = useChat(id!);
  
  if (!id || isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      <ChatHeader conversationId={id} />
      <ChatMessages messages={messages || []} userLanguage={profile?.language} />
      <ChatInput
        onSendMessage={sendMessage}
        onStartRecording={handleVoiceRecord}
        suggestions={[]}
      />
    </div>
  );
}
