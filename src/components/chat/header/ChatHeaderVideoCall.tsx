
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";

/**
 * Button for starting video calls (notifications completely removed).
 */
interface Props {
  conversationId: string;
}

export function ChatHeaderVideoCall({ conversationId }: Props) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      title="Start Video Call"
      disabled
    >
      <Video className="h-5 w-5" />
    </Button>
  );
}
