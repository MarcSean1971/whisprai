
import { MessageList } from "./message/MessageList";
import { MessageReplyInput } from "./message/MessageReplyInput";

interface TranslationConsumerProps {
  messages: any[];
  currentUserId: string | null;
  userLanguage?: string;
  onNewReceivedMessage?: () => void;
  onTranslation?: (messageId: string, translatedContent: string) => void;
  onReply: (messageId: string) => void;
  replyToMessageId?: string | null;
  sendReply?: (content: string) => Promise<boolean>;
  cancelReply?: () => void;
  refetch?: () => void;
  messageRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
  scrollToMessage: (messageId: string) => void;
}

export function TranslationConsumer({
  messages,
  currentUserId,
  userLanguage,
  onNewReceivedMessage,
  onTranslation,
  onReply,
  replyToMessageId,
  sendReply,
  cancelReply,
  refetch,
  messageRefs,
  scrollToMessage
}: TranslationConsumerProps) {
  const handleMessageDelete = () => {
    console.log('Message was deleted, UI will update via React Query cache');
  };

  return (
    <>
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        profile={{ language: userLanguage }}
        translatedContents={{}}
        onReply={onReply}
        replyToMessageId={replyToMessageId}
        scrollToMessage={scrollToMessage}
      />
      {sendReply && cancelReply && replyToMessageId && (
        <div className="ml-10 mb-4">
          <MessageReplyInput
            onSubmit={async (content: string) => {
              const sent = await sendReply(content);
              if (sent && refetch) {
                refetch();
              }
            }}
            onCancel={cancelReply}
          />
        </div>
      )}
    </>
  );
}
