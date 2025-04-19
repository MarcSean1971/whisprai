import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { TranslationIcon } from "./chat/TranslationIcon";
import { useState } from "react";
import { MapPin, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type MessageStatus = "sending" | "sent" | "delivered" | "read";

interface ChatMessageProps {
  id: string;
  content: string;
  timestamp: string;
  isOwn?: boolean;
  status?: MessageStatus;
  sender?: {
    name: string;
    avatar?: string;
    language?: string;
  };
  showSender?: boolean;
  isAI?: boolean;
  originalLanguage?: string;
  translatedContent?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  onDelete?: () => void;
  userId?: string | null;
  viewerId?: string | null;
}

export function ChatMessage({
  id,
  content,
  timestamp,
  isOwn = false,
  sender,
  showSender = false,
  isAI = false,
  originalLanguage,
  translatedContent,
  location,
  onDelete,
  userId,
  viewerId
}: ChatMessageProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const displayContent = showOriginal ? content : (translatedContent || content);
  const hasTranslation = !!translatedContent && content !== translatedContent;
  const showTranslationToggle = hasTranslation && originalLanguage !== 'en';
  
  const canDelete = isAI;

  const handleLocationClick = () => {
    if (location) {
      window.open(
        `https://www.google.com/maps?q=${location.latitude},${location.longitude}`,
        '_blank'
      );
    }
  };

  const handleDelete = async () => {
    if (isDeleting || !id) return;
    
    try {
      setIsDeleting(true);
      
      console.log('Attempting to delete message:', id);
      console.log('Current user ID:', userId);
      console.log('Message viewer ID:', viewerId);
      
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('Error deleting message:', error);
        toast.error('Failed to delete message');
        throw error;
      }
      
      toast.success('Message deleted');
      if (onDelete) onDelete();
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={cn(
      "flex gap-2 w-full items-start",
      isOwn ? "justify-end" : "justify-start"
    )}>
      {!isOwn && !isAI && sender && (
        <Avatar className="h-6 w-6 flex-shrink-0">
          <AvatarImage src={sender.avatar} alt={sender.name} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {sender.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      {!isOwn && isAI && (
        <Avatar className="h-6 w-6 flex-shrink-0">
          <AvatarFallback className="bg-violet-500/20 text-violet-700 text-xs">
            AI
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn(
        "flex flex-col max-w-[75%]",
        isOwn ? "items-end" : "items-start"
      )}>
        {showSender && sender && !isOwn && !isAI && (
          <span className="text-xs text-muted-foreground mb-0.5">
            {sender.name}
          </span>
        )}
        
        <div className="flex items-start gap-2">
          <div className={cn(
            "rounded-lg py-2 px-3",
            isOwn
              ? "bg-primary text-primary-foreground"
              : isAI
              ? "bg-violet-500/20 border border-violet-500/20"
              : "bg-secondary"
          )}>
            <div className="text-sm">{displayContent}</div>
            <div className="text-[10px] opacity-70 text-right mt-0.5">
              {timestamp}
            </div>
          </div>

          {location && (
            <button
              onClick={handleLocationClick}
              className="p-1 rounded-full hover:bg-accent/10 transition-colors"
              title="View location on map"
            >
              <MapPin className="h-4 w-4" />
            </button>
          )}

          {showTranslationToggle && (
            <TranslationIcon 
              originalLanguage={originalLanguage || 'unknown'}
              onClick={() => setShowOriginal(!showOriginal)}
            />
          )}
          
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1 rounded-full hover:bg-red-100 text-red-500 hover:text-red-600 transition-colors"
              title="Delete message"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
