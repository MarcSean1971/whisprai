
import React, { useState, useEffect } from "react";
import { Header } from "@/components/home/Header";
import { BottomNavigation } from "@/components/home/BottomNavigation";
import { NewMessageButton } from "@/components/home/NewMessageButton";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/use-admin";
import { useUserConversations } from "@/hooks/use-user-conversations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Chats() {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { isAdmin } = useAdmin();
  const { data: conversations, isLoading, error, refetch } = useUserConversations();

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session found, redirecting to auth');
        navigate('/auth');
      }
    };
    
    checkAuth();
  }, [navigate]);

  const filteredConversations = searchQuery && conversations
    ? conversations.filter(convo => 
        convo.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  const handleConversationClick = (id: string) => {
    navigate(`/chat/${id}`);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error("Failed to log out. Please try again.");
        return;
      }
      
      toast.success("Successfully logged out");
      navigate("/");
    } catch (error) {
      toast.error("An unexpected error occurred during logout");
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background w-full max-w-full">
      <Header 
        isSearching={isSearching}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchToggle={() => setIsSearching(!isSearching)}
      />
      
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-0.5">
          {filteredConversations?.map((conversation) => (
            <div 
              key={conversation.id}
              className="p-4 hover:bg-accent cursor-pointer"
              onClick={() => handleConversationClick(conversation.id)}
            >
              <div className="font-medium">{conversation.name}</div>
              {conversation.lastMessage && (
                <div className="text-sm text-muted-foreground truncate">
                  {conversation.lastMessage.content}
                </div>
              )}
            </div>
          ))}
          {(!filteredConversations || filteredConversations.length === 0) && (
            <div className="text-center p-4 text-muted-foreground">
              No conversations found
            </div>
          )}
        </div>
      </div>

      <NewMessageButton />
      
      <BottomNavigation 
        activeTab="chats"
        isAdmin={isAdmin}
      />
    </div>
  );
}
