
import { MessageSkeleton } from "./MessageSkeleton";

export function MessagesLoadingState() {
  return (
    <div className="absolute inset-0 overflow-y-auto px-4 py-2 space-y-4 no-scrollbar">
      <MessageSkeleton />
      <MessageSkeleton />
      <MessageSkeleton />
    </div>
  );
}
