
import { Skeleton } from "@/components/ui/skeleton";

export function MessageSkeleton() {
  return (
    <div className="flex items-start gap-2 w-full max-w-[400px] animate-in fade-in-50">
      <Skeleton className="h-[100px] w-full rounded-lg" />
      <div className="flex flex-col gap-1">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
    </div>
  );
}
