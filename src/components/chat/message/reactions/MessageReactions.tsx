
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";
import EmojiPicker, { EmojiClickData, Theme, SkinTones } from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMessageReactions } from "@/hooks/use-message-reactions";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface MessageReactionsProps {
  messageId: string;
  isOwn?: boolean;
}

export function MessageReactions({ messageId, isOwn }: MessageReactionsProps) {
  const { reactions, addReaction, removeReaction } = useMessageReactions(messageId);
  const { profile } = useProfile();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Fetch the current user ID on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id || null);
    };
    
    getCurrentUser();
  }, []);

  // Group reactions by emoji
  const reactionCounts = reactions.reduce((acc, reaction) => {
    acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleEmojiClick = (data: EmojiClickData) => {
    const emoji = data.emoji;
    
    // Check if the current user has already reacted with this emoji
    const hasReacted = reactions.some(r => 
      r.emoji === emoji && r.user_id === currentUserId
    );

    if (hasReacted) {
      removeReaction({ emoji });
    } else {
      addReaction({ emoji });
    }
  };

  return (
    <div className="flex items-center gap-1 mt-1">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full hover:bg-accent"
          >
            <Smile className="h-4 w-4" />
            <span className="sr-only">Add reaction</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            width={300}
            height={350}
          />
        </PopoverContent>
      </Popover>

      {Object.entries(reactionCounts).map(([emoji, count]) => {
        const hasReacted = reactions.some(r => 
          r.emoji === emoji && r.user_id === currentUserId
        );

        return (
          <Button
            key={emoji}
            variant="ghost"
            size="sm"
            onClick={() => handleEmojiClick({ 
              emoji, 
              names: [], 
              activeSkinTone: SkinTones.NEUTRAL,
              unified: "",
              unifiedWithoutSkinTone: "",
              imageUrl: "",
              getImageUrl: () => "",
              isCustom: false
            })}
            className={cn(
              "h-6 px-2 text-xs rounded-full",
              hasReacted && "bg-accent",
              isOwn && "text-primary-foreground hover:text-primary-foreground"
            )}
          >
            {emoji} {count}
          </Button>
        );
      })}
    </div>
  );
}
