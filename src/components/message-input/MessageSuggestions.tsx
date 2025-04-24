
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { PredictiveAnswer } from "@/types/predictive-answer";
import { cn } from "@/lib/utils";

interface MessageSuggestionsProps {
  suggestions: PredictiveAnswer[];
  isLoading: boolean;
  onSuggestionClick: (text: string) => void;
  disabled?: boolean;
  hideOnKeyboard?: boolean;
}

export function MessageSuggestions({ 
  suggestions, 
  isLoading, 
  onSuggestionClick,
  disabled,
  hideOnKeyboard = false
}: MessageSuggestionsProps) {
  if (!suggestions.length && !isLoading) return null;

  return (
    <div className={cn(
      "mb-2 overflow-x-auto no-scrollbar relative z-30 transition-all duration-200",
      hideOnKeyboard && "md:block hidden"
    )}>
      <div className="flex gap-2 pb-1">
        {isLoading ? (
          <Button
            variant="outline"
            size="sm"
            className="bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 transition-colors whitespace-nowrap flex-shrink-0"
            disabled
          >
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
            Generating suggestions...
          </Button>
        ) : (
          <div className="flex gap-2">
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion.id}
                variant="outline"
                size="sm"
                className="bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-colors group whitespace-nowrap flex-shrink-0"
                onClick={() => onSuggestionClick(suggestion.text)}
                disabled={disabled}
              >
                <Sparkles className="h-3 w-3 mr-1 text-primary/70 group-hover:text-primary/90" />
                {suggestion.text}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
