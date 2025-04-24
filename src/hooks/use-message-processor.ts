
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { useTranslationContext } from '@/contexts/TranslationContext';
import { useMessageSound } from './use-message-sound';

export function useMessageProcessor(
  messages: any[],
  currentUserId: string | null,
  userLanguage?: string,
  onNewReceivedMessage?: () => void,
  onTranslation?: (messageId: string, translatedContent: string) => void,
) {
  const [lastProcessedMessageId, setLastProcessedMessageId] = useState<string | null>(null);
  const { translateMessage } = useTranslation();
  const { playMessageSound } = useMessageSound();
  const { 
    translatedContents, 
    setTranslatedContents, 
    translationsInProgress,
    setTranslationsInProgress 
  } = useTranslationContext();

  const processTranslations = useCallback(async () => {
    if (!userLanguage || !currentUserId || translationsInProgress > 0 || !Array.isArray(messages)) {
      return;
    }

    const pendingTranslations = messages
      .filter(message => 
        message?.sender_id !== currentUserId &&
        message?.sender_id !== null &&
        message?.original_language &&
        message?.original_language !== userLanguage &&
        message?.id &&
        !translatedContents[message.id]
      )
      .slice(0, 5);

    if (pendingTranslations.length === 0) return;

    setTranslationsInProgress(pendingTranslations.length);
    
    try {
      await Promise.all(
        pendingTranslations.map(async (message) => {
          try {
            const translated = await translateMessage(message.content, userLanguage);
            if (translated && translated !== message.content) {
              setTranslatedContents(prev => ({
                ...prev,
                [message.id]: translated
              }));
              
              onTranslation?.(message.id, translated);
            }
          } catch (error) {
            console.error(`Translation error for message ${message.id}:`, error);
          }
        })
      );
    } finally {
      setTranslationsInProgress(0);
    }
  }, [messages, userLanguage, currentUserId, translatedContents, translateMessage, onTranslation, setTranslatedContents, setTranslationsInProgress, translationsInProgress]);

  useEffect(() => {
    if (!Array.isArray(messages) || !currentUserId || !messages.length || translationsInProgress > 0) {
      return;
    }
    
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.id || lastMessage.id === lastProcessedMessageId) {
      return;
    }

    if (lastMessage.sender_id !== currentUserId) {
      setLastProcessedMessageId(lastMessage.id);
      playMessageSound();
      onNewReceivedMessage?.();
    }

    return () => {
      // Cleanup if needed
    };
  }, [messages, currentUserId, lastProcessedMessageId, onNewReceivedMessage, translationsInProgress, playMessageSound]);

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
