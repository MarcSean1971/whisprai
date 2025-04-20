
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import debounce from 'lodash/debounce';

export function useToxicityAnalysis() {
  const [toxicityScore, setToxicityScore] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzedText, setLastAnalyzedText] = useState('');

  const debouncedAnalyze = useCallback(
    debounce(async (message: string) => {
      // Reset score if message is empty
      if (!message.trim()) {
        setToxicityScore(0);
        setLastAnalyzedText('');
        return;
      }

      // Skip if the same text was just analyzed
      if (message === lastAnalyzedText) {
        return;
      }

      setIsAnalyzing(true);
      try {
        const { data, error } = await supabase.functions.invoke('analyze-toxicity', {
          body: { message }
        });

        if (error) throw error;
        
        // Smooth transition to new score
        const currentScore = toxicityScore;
        const targetScore = data.score;
        const step = (targetScore - currentScore) / 10;
        
        // Animate the score change
        let frame = 0;
        const animate = () => {
          if (frame < 10) {
            setToxicityScore(prev => prev + step);
            frame++;
            requestAnimationFrame(animate);
          } else {
            setToxicityScore(targetScore);
          }
        };
        
        requestAnimationFrame(animate);
        setLastAnalyzedText(message);
      } catch (error) {
        console.error('Error analyzing toxicity:', error);
      } finally {
        setIsAnalyzing(false);
      }
    }, 300),
    [toxicityScore]
  );

  useEffect(() => {
    return () => {
      debouncedAnalyze.cancel();
    };
  }, [debouncedAnalyze]);

  return { toxicityScore, isAnalyzing, analyzeToxicity: debouncedAnalyze };
}

