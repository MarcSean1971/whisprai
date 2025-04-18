
import { useState } from 'react';
import { toast } from 'sonner';

export function useTranslation() {
  const [translations, setTranslations] = useState<Record<string, string>>({});

  const translateMessage = async (text: string, targetLanguage: string): Promise<string> => {
    try {
      // Check if we already have this translation cached
      const cacheKey = `${text}:${targetLanguage}`;
      if (translations[cacheKey]) {
        return translations[cacheKey];
      }
      
      // In a real app, this would call a translation service
      // For now, we're just appending a note to the text
      const result = `${text} (translated to ${targetLanguage})`;
      
      // Cache the result
      setTranslations(prev => ({
        ...prev,
        [cacheKey]: result
      }));
      
      return result;
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Failed to translate message');
      return text; // Fall back to original text
    }
  };

  return {
    translateMessage,
    translations
  };
}
