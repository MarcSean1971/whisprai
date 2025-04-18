
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";

// Components
import { Header } from "@/components/home/Header";
import { BottomNavigation } from "@/components/home/BottomNavigation";
import { NewMessageButton } from "@/components/home/NewMessageButton";
import { TabsSection } from "@/components/home/TabsSection";

// Sample data
import { conversations } from "@/lib/sample-data";

export default function Home() {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredConversations, setFilteredConversations] = useState(conversations);
  const [activeTab, setActiveTab] = useState<'messages' | 'contacts'>('messages');
  const { isAdmin } = useAdmin();

  useEffect(() => {
    if (searchQuery) {
      const filtered = conversations.filter(
        convo => convo.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredConversations(filtered);
    } else {
      setFilteredConversations(conversations);
    }
  }, [searchQuery]);

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

  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
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
        <TabsSection 
          filteredConversations={filteredConversations}
          searchQuery={searchQuery}
          onConversationClick={handleConversationClick}
          onClearSearch={handleClearSearch}
        />
      </div>

      <NewMessageButton />
      
      <BottomNavigation 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        isAdmin={isAdmin}
      />
    </div>
  );
}
