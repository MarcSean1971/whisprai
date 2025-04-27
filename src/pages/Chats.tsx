
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
import { TabsSection } from "@/components/home/TabsSection";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Chats() {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { isAdmin } = useAdmin();
  const { data: conversations, isLoading, error, refetch } = useUserConversations();
  const { isLoading: isAuthLoading, isAuthenticated } = useAuthProtection();
  
  // Only show loading state when auth is being checked
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-muted-foreground">Loading...</span>
      </div>
    );
  }

  // Additional check to catch any auth issues
  if (!isAuthenticated) {
    return null; // useAuthProtection will handle redirection
  }

  const filteredConversations = searchQuery && conversations
    ? conversations.filter(convo => 
        convo.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations || [];

  const handleConversationClick = (id: string) => {
    navigate(`/chat/${id}`);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
  };

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen bg-background w-full">
        <Header 
          isSearching={isSearching}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchToggle={() => setIsSearching(!isSearching)}
        />
        
        <div className="flex-1 overflow-y-auto pb-16">
          <TabsSection
            activeTab="chats"
            filteredConversations={filteredConversations}
            searchQuery={searchQuery}
            onConversationClick={handleConversationClick}
            onClearSearch={handleClearSearch}
            onTabChange={() => {}}
            isLoading={isLoading}
            error={error instanceof Error ? error : null}
          />
        </div>

        <NewMessageButton />
        
        <BottomNavigation 
          activeTab="chats"
          isAdmin={isAdmin}
        />
      </div>
    </ErrorBoundary>
  );
}
