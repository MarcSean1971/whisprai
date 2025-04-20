import React, { useState, useEffect } from "react";
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
import { ShareButton } from "@/components/shared/ShareButton";

export default function Chats() {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { isAdmin } = useAdmin();
  const { data: conversations, isLoading, error, refetch } = useUserConversations();
  
  useAuthProtection();

  useEffect(() => {
    if (error) {
      console.error("Error loading conversations, will retry:", error);
      const timer = setTimeout(() => {
        refetch();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [error, refetch]);

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
    <div className="flex flex-col h-screen bg-background w-full">
      <Header 
        isSearching={isSearching}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchToggle={() => setIsSearching(!isSearching)}
        rightAction={<ShareButton />}
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
  );
}
