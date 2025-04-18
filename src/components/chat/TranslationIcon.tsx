
import { Languages } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
            className="p-1 rounded-full hover:bg-accent/10 transition-colors"
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
