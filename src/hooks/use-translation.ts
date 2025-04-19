
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
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

      console.log(`Translating message to ${targetLanguage}`);
      
      const { data, error } = await supabase.functions.invoke('translate-message', {
        body: { text, targetLanguage }
      });

      if (error) throw error;

      const translation = data.translation;
      
      // Cache the result
      setTranslations(prev => ({
        ...prev,
        [cacheKey]: translation
      }));
      
      return translation;
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
