
import { AlertCircle } from "lucide-react";

export function ErrorDisplay() {
  return (
    <div className="flex items-center text-destructive text-xs px-2">
      <AlertCircle className="h-3 w-3 mr-1" />
      <span>Audio error</span>
    </div>
  );
}
