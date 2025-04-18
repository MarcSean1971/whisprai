
import { useState } from 'react';
import { toast } from 'sonner';

export function useTranslation() {
  const [translations, setTranslations] = useState<Record<string, string>>({});

  const translateMessage = async (text: string, targetLanguage: string) => {
    // For now, returning the original text. In a real app, you would use a translation service
    return text;
  };

  return {
    translateMessage,
    translations
  };
}
