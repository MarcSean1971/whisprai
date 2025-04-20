
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { useTranslationContext } from '@/contexts/TranslationContext';

export function useMessageProcessor(
  messages: any[],
  currentUserId: string | null,
  userLanguage?: string,
  onNewReceivedMessage?: () => void,
  onTranslation?: (messageId: string, translatedContent: string) => void,
) {
  const [lastProcessedMessageId, setLastProcessedMessageId] = useState<string | null>(null);
  const { translateMessage } = useTranslation();
  const { 
    translatedContents, 
    setTranslatedContents, 
    translationsInProgress,
    setTranslationsInProgress 
  } = useTranslationContext();

  const processTranslations = useCallback(async () => {
    if (!userLanguage || !currentUserId || translationsInProgress > 0) return;

    const pendingTranslations = messages
      .filter(message => 
        message.sender_id !== currentUserId &&
        message.sender_id !== null &&
        message.original_language &&
        message.original_language !== userLanguage &&
        !translatedContents[message.id]
      )
      .slice(0, 5);

    if (pendingTranslations.length === 0) return;

    setTranslationsInProgress(pendingTranslations.length);
    
    try {
      await Promise.all(
        pendingTranslations.map(async (message) => {
          const translated = await translateMessage(message.content, userLanguage);
          if (translated !== message.content) {
            // Fix: Create a new object with the previous state and add the new translation
            const newTranslations = {
              ...translatedContents,
              [message.id]: translated
            };
            setTranslatedContents(newTranslations);
            
            onTranslation?.(message.id, translated);
          }
        })
      );
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setTranslationsInProgress(0);
    }
  }, [messages, userLanguage, currentUserId, translatedContents, translateMessage, onTranslation, setTranslatedContents, setTranslationsInProgress, translationsInProgress]);

  useEffect(() => {
    let mounted = true;

    const processNewMessage = () => {
      if (!messages.length || !currentUserId || translationsInProgress > 0) return;
      
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.id === lastProcessedMessageId) return;

      if (lastMessage.sender_id !== currentUserId) {
        setLastProcessedMessageId(lastMessage.id);
        onNewReceivedMessage?.();
      }
    };

    processNewMessage();

    return () => {
      mounted = false;
    };
  }, [messages, currentUserId, lastProcessedMessageId, onNewReceivedMessage, translationsInProgress]);

  useEffect(() => {
    let mounted = true;

    const runTranslations = async () => {
      if (mounted) {
        await processTranslations();
      }
    };

    runTranslations();

    return () => {
      mounted = false;
    };
  }, [processTranslations]);

  return {
    translatedContents,
    translationsInProgress
  };
}
