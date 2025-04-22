
import { AlertCircle } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface MessagesErrorStateProps {
  error: Error;
  refetch: () => void;
}

export function MessagesErrorState({ error, refetch }: MessagesErrorStateProps) {
  return (
    <EmptyState
      icon={<AlertCircle className="h-10 w-10 text-destructive" />}
      title="Error loading messages"
      description={error.message}
      action={
        <Button onClick={() => refetch()} variant="outline">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Retry
        </Button>
      }
      className="absolute inset-0 flex items-center justify-center"
    />
  );
}
