
import { MapPin, Trash2 } from "lucide-react";
import { TranslationIcon } from "../TranslationIcon";

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
        <TranslationIcon 
          originalLanguage={originalLanguage || 'unknown'}
          onClick={onToggleTranslation}
        />
      )}
      
      {location && (
        <button
          onClick={onLocationClick}
          className="p-1 rounded-full hover:bg-accent/10 transition-colors"
          title="View location on map"
        >
          <MapPin className="h-4 w-4" />
        </button>
      )}
      
      {canDelete && (
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="p-1 rounded-full hover:bg-red-100 text-red-500 hover:text-red-600 transition-colors"
          title="Delete message"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </>
  );
}
