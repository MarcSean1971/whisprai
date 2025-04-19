
import React, { useState } from "react";
import { Header } from "@/components/home/Header";
import { BottomNavigation } from "@/components/home/BottomNavigation";
import { NewMessageButton } from "@/components/home/NewMessageButton";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/use-admin";
import { useUserConversations } from "@/hooks/use-user-conversations";
import { useAuthProtection } from "@/hooks/use-auth-protection";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

export default function Chats() {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { isAdmin } = useAdmin();
  const { data: conversations, isLoading, error } = useUserConversations();
  
  // Use auth protection hook
  useAuthProtection();

  const filteredConversations = searchQuery && conversations
    ? conversations.filter(convo => 
        convo.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  const handleConversationClick = (id: string) => {
    navigate(`/chat/${id}`);
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
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Alert variant="destructive" className="m-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error instanceof Error ? error.message : 'Failed to load conversations'}
            </AlertDescription>
          </Alert>
        ) : filteredConversations?.length ? (
          <div className="space-y-0.5">
            {filteredConversations.map((conversation) => (
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
          </div>
        ) : (
          <EmptyState
            icon={<AlertCircle className="h-6 w-6 text-muted-foreground" />}
            title="No conversations yet"
            description="Start a new conversation using the button below"
          />
        )}
      </div>

      <NewMessageButton />
      
      <BottomNavigation 
        activeTab="chats"
        isAdmin={isAdmin}
      />
    </div>
  );
}
