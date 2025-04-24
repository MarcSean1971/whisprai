
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function LoadingSuggestion() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 transition-colors whitespace-nowrap flex-shrink-0"
      disabled
    >
      <Loader2 className="h-3 w-3 animate-spin mr-1" />
      Generating suggestions...
    </Button>
  );
}
