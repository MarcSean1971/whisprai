
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PermissionErrorProps {
  className?: string;
}

export function PermissionError({ className }: PermissionErrorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="destructive"
        onClick={() => toast.error('Please enable microphone access in your browser settings')}
      >
        Microphone Access Needed
      </Button>
    </div>
  );
}
