
import { MapPin } from "lucide-react";

interface LocationControlProps {
  onLocationClick: () => void;
}

export function LocationControl({ onLocationClick }: LocationControlProps) {
  return (
    <button
      onClick={onLocationClick}
      className="p-1 rounded-full hover:bg-accent/10 transition-colors"
      title="View location on map"
    >
      <MapPin className="h-4 w-4" />
    </button>
  );
}
