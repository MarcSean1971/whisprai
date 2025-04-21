import { cn } from "@/lib/utils";
import { useMessageReactions } from "@/hooks/use-message-reactions";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

interface MessageReactionsProps {
  messageId: string;
  isOwn?: boolean;
}

export function MessageReactions({ messageId, isOwn }: MessageReactionsProps) {
  const { reactions, removeReaction } = useMessageReactions(messageId);
  
  // Group reactions by emoji and count them
  const reactionGroups = reactions.reduce((acc, reaction) => {
    acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (Object.keys(reactionGroups).length === 0) {
    return null;
  }

  const handleClick = (emoji: string) => {
    removeReaction({ emoji });
  };

  return (
    <div className="flex flex-wrap gap-1">
      {Object.entries(reactionGroups).map(([emoji, count]) => (
        <Button
          key={emoji}
          variant="ghost"
          size="sm"
          onClick={() => handleClick(emoji)}
          className={cn(
            "h-5 px-1.5 text-[10px] flex items-center gap-0.5 bg-black/5 hover:bg-black/10 rounded-full",
            isOwn && "bg-white/10 hover:bg-white/20"
          )}
        >
          {emoji}
          {count > 1 && (
            <span className="ml-1 font-medium">{count}</span>
          )}
        </Button>
      ))}
    </div>
  );
}
