
import { TranslationControl } from "./controls/TranslationControl";
import { LocationControl } from "./controls/LocationControl";
import { DeleteControl } from "./controls/DeleteControl";

interface MessageControlsProps {
  showTranslationToggle: boolean;
  originalLanguage: string;
  onToggleTranslation: () => void;
  location?: { latitude: number; longitude: number };
  onLocationClick: () => void;
  canDelete: boolean;
  onDelete: () => void;
  isDeleting: boolean;
}

export function MessageControls({
  showTranslationToggle,
  originalLanguage,
  onToggleTranslation,
  location,
  onLocationClick,
  canDelete,
  onDelete,
  isDeleting
}: MessageControlsProps) {
  return (
    <>
      {showTranslationToggle && (
        <TranslationControl 
          originalLanguage={originalLanguage}
          onToggleTranslation={onToggleTranslation}
        />
      )}
      
      {location && (
        <LocationControl onLocationClick={onLocationClick} />
      )}
      
      {canDelete && (
        <DeleteControl 
          onDelete={onDelete}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
}
