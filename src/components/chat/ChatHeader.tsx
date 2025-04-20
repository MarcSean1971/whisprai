
import { BackButton } from "@/components/ui/back-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useConversation } from "@/hooks/use-conversation";
import { useProfile } from "@/hooks/use-profile";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

interface ChatHeaderProps {
  conversationId: string;
  replyToMessageId?: string | null;
  onCancelReply?: () => void;
}

export function ChatHeader({ 
  conversationId,
  replyToMessageId,
  onCancelReply
}: ChatHeaderProps) {
  const { conversation } = useConversation(conversationId);
  const { profile } = useProfile();

  // Find the other participant in the conversation
  const participant = conversation?.participants?.find(p => {
    if (profile && 'id' in profile) {
      return p.id !== profile.id;
    }
    return true;
  });

  return (
    <div className="sticky top-0 z-10 bg-background border-b">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <BackButton />
          <Avatar>
            <AvatarImage src={participant?.avatar_url || ''} />
            <AvatarFallback>{participant?.first_name?.charAt(0)}{participant?.last_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-bold">{participant?.first_name} {participant?.last_name}</span>
            {participant?.tagline && (
              <span className="text-sm text-muted-foreground">{participant.tagline}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {replyToMessageId && onCancelReply && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onCancelReply}
            >
              Cancel Reply
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                Support
              </DropdownMenuItem>
              <DropdownMenuItem>
                License
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
