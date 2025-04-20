
import { useProfile } from "@/hooks/use-profile";
import { useMessageReactions } from "@/hooks/use-message-reactions";
import { cn } from "@/lib/utils";

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
    <div className="relative flex items-center justify-end space-x-1">
      {Object.entries(reactionGroups).map(([emoji, count]) => (
        <span
          key={emoji}
          className={cn(
            "text-[10px] px-1 py-0.5 rounded-full flex items-center gap-0.5",
            isOwn ? "bg-primary/10 text-primary" : "bg-accent/30"
          )}
        >
          {emoji} {count > 1 && <span className="font-medium">{count}</span>}
        </span>
      ))}
    </div>
  );
}
