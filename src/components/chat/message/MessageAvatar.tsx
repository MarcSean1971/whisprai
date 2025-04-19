
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot } from "lucide-react";

interface MessageAvatarProps {
  name: string;
  avatar?: string;
  isAI?: boolean;
}

export function MessageAvatar({ name, avatar, isAI }: MessageAvatarProps) {
  if (isAI) {
    return (
      <Avatar className="h-6 w-6 flex-shrink-0">
        <AvatarFallback className="bg-violet-500/20 text-violet-700">
          <Bot className="h-3.5 w-3.5" />
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar className="h-6 w-6 flex-shrink-0">
      <AvatarImage src={avatar} alt={name} />
      <AvatarFallback className="bg-primary/10 text-primary text-xs">
        {name.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
