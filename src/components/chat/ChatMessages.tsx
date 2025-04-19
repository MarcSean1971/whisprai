import { useRef, useEffect, useState } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { useTranslation } from "@/hooks/use-translation";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { format } from "date-fns";

interface ChatMessagesProps {
  messages: any[];
  userLanguage?: string;
  onNewReceivedMessage?: () => void;
}

export function ChatMessages({ 
  messages = [], 
  userLanguage = 'en',
  onNewReceivedMessage 
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { translateMessage } = useTranslation();
  const [translatedContents, setTranslatedContents] = useState<Record<string, string>>({});
  const { profile } = useProfile();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [lastProcessedMessageId, setLastProcessedMessageId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id || null);
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0 && currentUserId) {
      const lastMessage = messages[messages.length - 1];
      
      if (
        lastMessage.sender_id !== currentUserId && 
        lastMessage.id !== lastProcessedMessageId
      ) {
        setLastProcessedMessageId(lastMessage.id);
        
        if (onNewReceivedMessage) {
          onNewReceivedMessage();
        }
      }
    }
  }, [messages, currentUserId, lastProcessedMessageId, onNewReceivedMessage]);

  useEffect(() => {
    const channel = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${messages[0]?.conversation_id}`
        },
        (payload) => {
          console.log('Message deleted:', payload);
          const updatedMessages = messages.filter(msg => msg.id !== payload.old.id);
          messages = updatedMessages;
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messages]);

  useEffect(() => {
    const processTranslations = async () => {
      if (!profile?.language || !currentUserId) return;

      const newTranslations: Record<string, string> = {};
      
      for (const message of messages) {
        const isOwn = message.sender_id === currentUserId;
        
        const needsTranslation = !isOwn && 
          message.original_language && 
          message.original_language !== profile.language &&
          message.original_language !== 'en' &&
          !translatedContents[message.id];
        
        if (needsTranslation) {
          try {
            const translated = await translateMessage(message.content, profile.language);
            if (translated !== message.content) {
              newTranslations[message.id] = translated;
            }
          } catch (error) {
            console.error('Translation error:', error);
          }
        }
      }
      
      if (Object.keys(newTranslations).length > 0) {
        setTranslatedContents(prev => ({ ...prev, ...newTranslations }));
      }
    };
    
    processTranslations();
  }, [messages, profile?.language, translateMessage, currentUserId, translatedContents]);

  const handleMessageDelete = () => {
    console.log('Message was deleted, UI will update via React Query cache');
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
      {messages.map((message, index) => {
        const isOwn = message.sender_id === currentUserId;
        const isAI = message.sender_id === null;
        const showSender = !isOwn && !isAI && (index === 0 || messages[index - 1].sender_id !== message.sender_id);
        
        const needsTranslation = !isOwn && !isAI && 
          message.original_language && 
          message.original_language !== profile?.language &&
          message.original_language !== 'en';

        const translatedContent = needsTranslation ? translatedContents[message.id] : undefined;
        const formattedTimestamp = format(new Date(message.created_at), 'HH:mm');

        const location = message.metadata?.location ? {
          latitude: message.metadata.location.latitude,
          longitude: message.metadata.location.longitude
        } : undefined;

        return (
          <ChatMessage
            key={message.id}
            id={message.id}
            content={message.content}
            timestamp={formattedTimestamp}
            isOwn={isOwn}
            isAI={isAI}
            status={message.status}
            sender={message.sender && {
              name: `${message.sender.profiles?.first_name || ''} ${message.sender.profiles?.last_name || ''}`.trim(),
              avatar: message.sender.profiles?.avatar_url,
              language: message.sender.profiles?.language
            }}
            showSender={showSender}
            originalLanguage={message.original_language}
            translatedContent={translatedContent}
            location={location}
            userId={currentUserId}
            viewerId={message.viewer_id}
            onDelete={handleMessageDelete}
          />
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
