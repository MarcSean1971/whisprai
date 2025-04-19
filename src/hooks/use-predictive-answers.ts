
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PredictiveAnswer } from "@/types/predictive-answer";
import { useLocation } from "@/hooks/use-location";
import { useProfile } from "@/hooks/use-profile";
import { toast } from "sonner";

export function usePredictiveAnswers(conversationId: string) {
  const [suggestions, setSuggestions] = useState<PredictiveAnswer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { requestLocation } = useLocation();
  const { profile } = useProfile();

  const clearSuggestions = () => {
    setSuggestions([]);
  };

  const generateSuggestions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Not authenticated");
      }

      let userLocation = null;
      try {
        userLocation = await requestLocation();
      } catch (e) {
        console.log("Location not available:", e);
      }

      const { data, error } = await supabase.functions.invoke("generate-predictive-answers", {
        body: {
          conversationId,
          userId: user.id,
          language: profile?.language || "en",
          userLocation
        }
      });

      if (error) throw error;
      
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error("Error generating suggestions:", err);
      setError(err instanceof Error ? err.message : "Failed to generate suggestions");
      toast.error("Could not generate response suggestions");
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    clearSuggestions();
  }, [conversationId]);

  return {
    suggestions,
    isLoading,
    error,
    generateSuggestions,
    clearSuggestions
  };
}
