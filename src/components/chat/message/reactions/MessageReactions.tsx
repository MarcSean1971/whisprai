
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
    <div className="w-full flex items-center justify-end gap-1">
      {Object.entries(reactionGroups).map(([emoji, count]) => (
        <span
          key={emoji}
          className="text-[10px] flex items-center gap-0.5"
        >
          {emoji} {count > 1 && <span className="font-medium">{count}</span>}
        </span>
      ))}
    </div>
  );
}
