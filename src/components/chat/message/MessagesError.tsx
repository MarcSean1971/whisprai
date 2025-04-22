
import { AlertCircle } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

interface MessagesErrorProps {
  error: Error;
}

export function MessagesError({ error }: MessagesErrorProps) {
  return (
    <div className="absolute inset-0 overflow-y-auto flex items-center justify-center">
      <EmptyState
        icon={<AlertCircle className="h-10 w-10 text-destructive" />}
        title="Error loading messages"
        description={error.message}
        action={
          <button
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        }
      />
    </div>
  );
}
