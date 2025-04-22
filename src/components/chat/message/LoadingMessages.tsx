
import { Loader2 } from "lucide-react";

export function LoadingMessages() {
  return (
    <div className="flex justify-center py-2">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}
