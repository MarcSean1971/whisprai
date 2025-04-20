
import { cn } from "@/lib/utils";
import { useMessageReactions } from "@/hooks/use-message-reactions";

interface MessageReactionsProps {
  messageId: string;
  isOwn?: boolean;
}

export function MessageReactions({ messageId, isOwn }: MessageReactionsProps) {
  const { reactions } = useMessageReactions(messageId);
  
  // Group reactions by emoji and count them
  const reactionGroups = reactions.reduce((acc, reaction) => {
    acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (Object.keys(reactionGroups).length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1 mt-1">
      {Object.entries(reactionGroups).map(([emoji, count]) => (
        <span
          key={emoji}
          className={cn(
            "text-[10px] flex items-center gap-0.5 bg-muted/50 px-1.5 py-0.5 rounded-full",
            isOwn && "bg-primary/10"
          )}
        >
          {emoji} {count > 1 && <span className="font-medium">{count}</span>}
        </span>
      ))}
    </div>
  );
}
