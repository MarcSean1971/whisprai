
import { Languages } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TranslationIconProps {
  originalLanguage: string;
  onClick?: () => void;
}

export function TranslationIcon({ originalLanguage, onClick }: TranslationIconProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              "p-1 rounded-full hover:bg-accent/10 transition-colors",
              "flex items-center justify-center",
              "text-muted-foreground hover:text-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            )}
          >
            <Languages className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Originally in {originalLanguage}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
