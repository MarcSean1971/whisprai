
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { PinIcon, Image as ImageIcon, Paperclip, MapPin, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/hooks/use-messages";

interface ConversationItemProps {
  id: string;
  name?: string;
  avatar?: string;
  lastMessage?: Message;
  timestamp?: string;
  isPinned?: boolean;
  isGroup?: boolean;
  isActive?: boolean;
  participants?: Array<{ id: string; name: string; avatar?: string }>;
  onClick?: () => void;
}

const getMessagePreview = (message: Message | undefined): string => {
  if (!message) return '';
  
  if (message.metadata?.voiceMessage) {
    return '🎤 Voice message';
  }
  
  if (message.metadata?.location) {
    return '📍 Shared location';
  }
  
  if (message.metadata?.attachments?.length) {
    const attachment = message.metadata.attachments[0];
    if (attachment.type.startsWith('image/')) {
      return '📸 Photo';
    }
    return `📎 ${attachment.name}`;
  }
  
  return message.content;
};

export function ConversationItem({
  id,
  name = "Chat",
  avatar,
  lastMessage,
  timestamp,
  isPinned = false,
  isGroup = false,
  isActive = false,
  participants = [],
  onClick,
}: ConversationItemProps) {
  return (
    <div
      className={cn(
        "flex items-center p-3 rounded-lg cursor-pointer transition-colors",
        isActive ? "bg-primary/10" : "hover:bg-secondary",
      )}
      onClick={onClick}
    >
      {isGroup ? (
        <AvatarStack
          avatars={participants.map(p => ({
            src: p.avatar,
            name: p.name
          }))}
          limit={3}
          size="md"
          className="mr-3 flex-shrink-0"
        />
      ) : (
        <Avatar className="h-12 w-12 mr-3 flex-shrink-0">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {name?.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{name}</span>
            {isPinned && <PinIcon className="h-3 w-3 text-muted-foreground" />}
          </div>
          {timestamp && (
            <span className="text-xs text-muted-foreground">{timestamp}</span>
          )}
        </div>
        
        {lastMessage && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
              {lastMessage.sender?.profiles?.first_name 
                ? `${lastMessage.sender.profiles.first_name}: ` 
                : ""}
              {getMessagePreview(lastMessage)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
