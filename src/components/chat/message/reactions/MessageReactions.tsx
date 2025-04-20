
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { useMessageReactions } from "@/hooks/use-message-reactions";
import { cn } from "@/lib/utils";

interface MessageReactionsProps {
  messageId: string;
  isOwn?: boolean;
}

export function MessageReactions({ messageId, isOwn }: MessageReactionsProps) {
  const { reactions } = useMessageReactions(messageId);
  
  // Group reactions by emoji
  const reactionCounts = reactions.reduce((acc, reaction) => {
    acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (Object.keys(reactionCounts).length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      {Object.entries(reactionCounts).map(([emoji, count]) => (
        <span
          key={emoji}
          className={cn(
            "text-xs px-1.5 py-0.5 rounded-full bg-accent/50",
            isOwn && "text-primary-foreground"
          )}
        >
          {emoji} {count}
        </span>
      ))}
    </div>
  );
}
