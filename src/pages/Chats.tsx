
import React, { useState, useEffect } from "react";
import { Header } from "@/components/home/Header";
import { BottomNavigation } from "@/components/home/BottomNavigation";
import { NewMessageButton } from "@/components/home/NewMessageButton";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/use-admin";
import { EmptyState } from "@/components/EmptyState";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConversationItem } from "@/components/ConversationItem";
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
  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/');
      return;
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const filteredConversations = searchQuery && conversations
    ? conversations.filter(convo => 
        convo.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  const handleConversationClick = (id: string) => {
    navigate(`/chat/${id}`);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
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
          {isLoading ? (
            <div className="p-4 text-center">Loading conversations...</div>
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-red-500 mb-2">Unable to load conversations</p>
              <Button onClick={() => refetch()} variant="outline" className="mt-2">
                Retry
              </Button>
            </div>
          ) : filteredConversations && filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                id={conversation.id}
                name={conversation.name || "Conversation"}
                avatar={conversation.avatar || undefined}
                lastMessage={conversation.lastMessage?.content}
                timestamp={conversation.lastMessage?.created_at ? new Date(conversation.lastMessage.created_at).toLocaleTimeString() : undefined}
                unreadCount={0}
                isGroup={conversation.is_group}
                onClick={() => handleConversationClick(conversation.id)}
              />
            ))
          ) : (
            <EmptyState
              icon={<Search className="h-6 w-6 text-muted-foreground" />}
              title={searchQuery ? "No conversations found" : "No conversations yet"}
              description={
                searchQuery
                  ? `No results for "${searchQuery}"`
                  : "Start a new conversation by clicking the + button"
              }
              action={
                searchQuery ? (
                  <Button onClick={handleClearSearch}>Clear search</Button>
                ) : undefined
              }
              className="h-[calc(100vh-8rem)]"
            />
          )}
        </div>
      </div>

      <NewMessageButton />
      
      <BottomNavigation 
        activeTab="chats"
        onLogout={handleLogout}
        isAdmin={isAdmin}
      />
    </div>
  );
}
