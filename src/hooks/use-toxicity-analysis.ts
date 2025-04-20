
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import debounce from 'lodash/debounce';

export function useToxicityAnalysis() {
  const [toxicityScore, setToxicityScore] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzedText, setLastAnalyzedText] = useState('');

  // Debounced analysis function to prevent too many API calls
  const debouncedAnalyze = useCallback(
    debounce(async (message: string) => {
      if (!message.trim() || message === lastAnalyzedText) {
        return;
      }

      setIsAnalyzing(true);
      try {
        const { data, error } = await supabase.functions.invoke('analyze-toxicity', {
          body: { message }
        });

        if (error) throw error;
        setToxicityScore(data.score);
        setLastAnalyzedText(message);
      } catch (error) {
        console.error('Error analyzing toxicity:', error);
      } finally {
        setIsAnalyzing(false);
      }
    }, 300), // 300ms delay before analyzing
    []
  );

  useEffect(() => {
    return () => {
      debouncedAnalyze.cancel();
    };
  }, [debouncedAnalyze]);

  return { toxicityScore, isAnalyzing, analyzeToxicity: debouncedAnalyze };
}
