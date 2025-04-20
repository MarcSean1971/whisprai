
import { Button } from "@/components/ui/button";
import { Reply } from "lucide-react";

interface MessageReplyButtonProps {
  onReply: () => void;
  isOwn?: boolean;
}

export function MessageReplyButton({ onReply, isOwn }: MessageReplyButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 rounded-full hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={onReply}
    >
      <Reply className="h-4 w-4" />
      <span className="sr-only">Reply to message</span>
    </Button>
  );
}
