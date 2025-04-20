
import { createContext, useContext, useState, ReactNode } from 'react';

interface TranslationContextType {
  translatedContents: Record<string, string>;
  setTranslatedContents: (contents: Record<string, string>) => void;
  translationsInProgress: number;
  setTranslationsInProgress: (count: number) => void;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [translatedContents, setTranslatedContents] = useState<Record<string, string>>({});
  const [translationsInProgress, setTranslationsInProgress] = useState(0);

  return (
    <TranslationContext.Provider 
      value={{ 
        translatedContents, 
        setTranslatedContents,
        translationsInProgress,
        setTranslationsInProgress
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslationContext() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslationContext must be used within a TranslationProvider');
  }
  return context;
}
