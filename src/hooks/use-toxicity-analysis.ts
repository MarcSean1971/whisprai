
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import debounce from 'lodash/debounce';

export function useToxicityAnalysis() {
  const [toxicityScore, setToxicityScore] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeToxicity = useCallback(
    debounce(async (message: string) => {
      if (!message.trim()) {
        setToxicityScore(0);
        return;
      }

      setIsAnalyzing(true);
      try {
        const { data, error } = await supabase.functions.invoke('analyze-toxicity', {
          body: { message }
        });

        if (error) throw error;
        setToxicityScore(data.score);
      } catch (error) {
        console.error('Error analyzing toxicity:', error);
        setToxicityScore(0);
      } finally {
        setIsAnalyzing(false);
      }
    }, 500),
    []
  );

  return { toxicityScore, isAnalyzing, analyzeToxicity };
}
