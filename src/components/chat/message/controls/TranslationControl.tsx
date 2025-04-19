
import { TranslationIcon } from "../../TranslationIcon";

interface TranslationControlProps {
  originalLanguage: string;
  onToggleTranslation: () => void;
}

export function TranslationControl({ originalLanguage, onToggleTranslation }: TranslationControlProps) {
  return (
    <TranslationIcon 
      originalLanguage={originalLanguage}
      onClick={onToggleTranslation}
    />
  );
}
