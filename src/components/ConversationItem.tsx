import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { PinIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/hooks/use-messages";

interface ConversationItemProps {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: Message;
  timestamp?: string;
  unreadCount?: number;
  isPinned?: boolean;
  isGroup?: boolean;
  isActive?: boolean;
  participants?: Array<{ id: string; name: string; avatar?: string }>;
  onClick?: () => void;
}

export function ConversationItem({
  id,
  name,
  avatar,
  lastMessage,
  timestamp,
  unreadCount = 0,
  isPinned = false,
  isGroup = false,
  isActive = false,
  participants = [],
  onClick,
}: ConversationItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "flex items-center p-3 rounded-lg cursor-pointer transition-colors",
        isActive ? "bg-primary/10" : "hover:bg-secondary",
        unreadCount > 0 && "font-medium"
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isGroup ? (
        <AvatarStack
          avatars={participants.map(p => ({
            name: p.name,
            src: p.avatar
          }))}
          limit={3}
          size="md"
          className="mr-3 flex-shrink-0"
        />
      ) : (
        <Avatar className="h-12 w-12 mr-3 flex-shrink-0">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {name.slice(0, 2).toUpperCase()}
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
        
        {lastMessage?.content && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground truncate">
              {lastMessage.sender?.profiles?.first_name 
                ? `${lastMessage.sender.profiles.first_name}: ` 
                : ""}
              {lastMessage.content}
            </p>
            {unreadCount > 0 && (
              <Badge 
                variant="default" 
                className="ml-auto flex-shrink-0 bg-primary text-primary-foreground rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center text-xs"
              >
                {unreadCount}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
