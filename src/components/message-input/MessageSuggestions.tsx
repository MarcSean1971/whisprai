
import { SuggestionItem } from "./suggestions/SuggestionItem";
import { LoadingSuggestion } from "./suggestions/LoadingSuggestion";
import { PredictiveAnswer } from "@/types/predictive-answer";
import { useEffect, useRef } from "react";

interface MessageSuggestionsProps {
  suggestions: PredictiveAnswer[];
  isLoading: boolean;
  onSuggestionClick: (text: string) => void;
  disabled?: boolean;
  isVisible?: boolean;
  onSelect?: (suggestion: string) => void;
  conversationId?: string;
}

export function MessageSuggestions({ 
  suggestions = [], 
  isLoading = false, 
  onSuggestionClick,
  disabled = false,
  isVisible,
  onSelect,
  conversationId
}: MessageSuggestionsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Support both callback patterns
  const handleSelect = (suggestion: string) => {
    if (onSelect) {
      onSelect(suggestion);
    } else if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    }
  };

  // Auto-scroll to start when suggestions change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [suggestions]);

  // Don't render if explicitly set to not visible or if there are no suggestions and not loading
  if (isVisible === false || (!suggestions.length && !isLoading)) return null;

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
                onSelect={handleSelect}
                disabled={disabled}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
