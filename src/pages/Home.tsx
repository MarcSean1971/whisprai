import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdmin } from "@/hooks/use-admin";
import { useUserConversations } from "@/hooks/use-user-conversations";

// Components
import { Header } from "@/components/home/Header";
import { BottomNavigation } from "@/components/home/BottomNavigation";
import { NewMessageButton } from "@/components/home/NewMessageButton";
import { TabsSection } from "@/components/home/TabsSection";
import { Loader2 } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'chats' | 'contacts'>('chats');
  const { isAdmin } = useAdmin();
  const { data: conversations, isLoading, error } = useUserConversations();
  
  const filteredConversations = searchQuery && conversations
    ? conversations.filter(convo => 
        convo.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations || [];

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
      }
    };
    
    checkAuth();
  }, [navigate]);

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
    <div className="flex flex-col h-screen bg-background w-full">
      <Header 
        isSearching={isSearching}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchToggle={() => setIsSearching(!isSearching)}
      />
      
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[70vh] p-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Loading conversations...</p>
          </div>
        ) : (
          <TabsSection 
            activeTab={activeTab}
            filteredConversations={filteredConversations}
            searchQuery={searchQuery}
            onConversationClick={handleConversationClick}
            onClearSearch={handleClearSearch}
            onTabChange={(value) => setActiveTab(value as 'chats' | 'contacts')}
            isLoading={isLoading}
            error={error}
          />
        )}
      </div>

      <NewMessageButton />
      
      <BottomNavigation 
        activeTab={activeTab}
        isAdmin={isAdmin}
      />
    </div>
  );
}
