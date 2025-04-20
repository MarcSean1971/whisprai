
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import EmojiPicker from "emoji-picker-react";
import { useMessageReactions } from "@/hooks/use-message-reactions";

interface MessageReactionButtonProps {
  messageId: string;
  isOwn?: boolean;
}

export function MessageReactionButton({ messageId, isOwn }: MessageReactionButtonProps) {
  const { addReaction } = useMessageReactions(messageId);
  
  const handleEmojiClick = (emojiData: any) => {
    addReaction({ emoji: emojiData.emoji });
  };
  
  return (
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
      <PopoverContent className="w-full p-0" align={isOwn ? "end" : "start"}>
        <EmojiPicker
          width={300}
          height={350}
          onEmojiClick={handleEmojiClick}
        />
      </PopoverContent>
    </Popover>
  );
}
