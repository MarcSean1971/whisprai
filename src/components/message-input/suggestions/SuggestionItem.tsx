
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { PredictiveAnswer } from "@/types/predictive-answer";

interface SuggestionItemProps {
  suggestion: PredictiveAnswer;
  onSelect: (text: string) => void;
  disabled?: boolean;
}

export function SuggestionItem({ suggestion, onSelect, disabled }: SuggestionItemProps) {
  return (
    <Button
      key={suggestion.id}
      variant="outline"
      size="sm"
      className="bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-colors group whitespace-nowrap flex-shrink-0"
      onClick={() => onSelect(suggestion.text)}
      disabled={disabled}
    >
      <Sparkles className="h-3 w-3 mr-1 text-primary/70 group-hover:text-primary/90" />
      {suggestion.text}
    </Button>
  );
}
