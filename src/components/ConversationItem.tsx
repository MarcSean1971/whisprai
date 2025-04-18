
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { MoreVertical, PinIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConversationItemProps {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  timestamp?: string;
  unreadCount?: number;
  isPinned?: boolean;
  isGroup?: boolean;
  isActive?: boolean;
  participants?: Array<{ name: string; avatar?: string }>;
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
        isActive 
          ? "bg-primary/10" 
          : "hover:bg-secondary",
        unreadCount > 0 && "font-medium"
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isGroup ? (
        <AvatarStack
          avatars={participants}
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
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{name}</span>
            {isPinned && <PinIcon className="h-3 w-3 text-muted-foreground" />}
          </div>
          {timestamp && (
            <span className="text-xs text-muted-foreground">{timestamp}</span>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-1">
          {lastMessage && (
            <p className="text-sm text-muted-foreground truncate max-w-[80%]">
              {lastMessage}
            </p>
          )}
          
          {unreadCount > 0 && (
            <Badge 
              variant="default" 
              className="ml-auto bg-primary text-primary-foreground rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </div>
      </div>
      
      {isHovered && (
        <Button variant="ghost" size="icon" className="ml-2 text-muted-foreground">
          <MoreVertical className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
