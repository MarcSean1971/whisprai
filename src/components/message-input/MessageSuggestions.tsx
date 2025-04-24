
import { SuggestionItem } from "./suggestions/SuggestionItem";
import { LoadingSuggestion } from "./suggestions/LoadingSuggestion";
import { PredictiveAnswer } from "@/types/predictive-answer";
import { useEffect, useRef } from "react";

interface MessageSuggestionsProps {
  suggestions: PredictiveAnswer[];
  isLoading: boolean;
  onSuggestionClick: (text: string) => void;
  disabled?: boolean;
}

export function MessageSuggestions({ 
  suggestions, 
  isLoading, 
  onSuggestionClick,
  disabled 
}: MessageSuggestionsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to start when suggestions change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [suggestions]);

  if (!suggestions.length && !isLoading) return null;

  return (
    <div className="mb-0.5 relative z-30">
      <div 
        ref={scrollRef}
        className="overflow-x-auto no-scrollbar"
      >
        <div className="flex gap-2 pb-0.5">
          {isLoading ? (
            <LoadingSuggestion />
          ) : (
            suggestions.map((suggestion) => (
              <SuggestionItem
                key={suggestion.id}
                suggestion={suggestion}
                onSelect={onSuggestionClick}
                disabled={disabled}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
