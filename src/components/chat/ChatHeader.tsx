
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, MoreVertical, Phone, Search, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ChatHeaderProps {
  conversationId: string;
}

export function ChatHeader({ conversationId }: ChatHeaderProps) {
  const navigate = useNavigate();
  const [contact, setContact] = useState<{
    name: string;
    avatar?: string;
    isOnline?: boolean;
  }>({ name: "Chat" });

  useEffect(() => {
    const fetchConversationDetails = async () => {
      try {
        // Get current user
        const { data: authData, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('Error fetching user:', authError);
          return;
        }
        
        const currentUserId = authData.user?.id;
        
        // Get participants
        const { data: participants, error: participantsError } = await supabase
          .from('conversation_participants')
          .select(`
            user_id,
            profiles:user_id(
              first_name,
              last_name,
              avatar_url
            )
          `)
          .eq('conversation_id', conversationId);

        if (participantsError) {
          console.error('Error fetching participants:', participantsError);
          return;
        }

        if (participants && participants.length > 0) {
          // Find the other participant (not the current user)
          const otherParticipant = participants.find(
            p => p.user_id !== currentUserId
          );

          if (otherParticipant && otherParticipant.profiles) {
            const profile = otherParticipant.profiles;
            setContact({
              name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
              avatar: profile.avatar_url,
              isOnline: true
            });
          }
        }
      } catch (error) {
        console.error('Error fetching conversation details:', error);
      }
    };

    fetchConversationDetails();
  }, [conversationId]);

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/home")}
          className="md:hover:bg-accent"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <Avatar className="h-10 w-10">
          <AvatarImage src={contact.avatar} alt={contact.name} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {contact.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="ml-3">
          <h2 className="font-medium">{contact.name}</h2>
          <p className="text-xs text-muted-foreground">
            {contact.isOnline ? "Online" : "Last seen recently"}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon">
          <Search className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Phone className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Video className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
