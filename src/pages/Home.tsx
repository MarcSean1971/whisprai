import { useState, useEffect } from "react";
import { ConversationItem } from "@/components/ConversationItem";
import { Logo } from "@/components/Logo";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquarePlus, Search, Settings, Users, LogOut, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdmin } from "@/hooks/use-admin";
import { useIsMobile } from "@/hooks/use-mobile";

// Sample data
import { conversations } from "@/lib/sample-data";

export default function Home() {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredConversations, setFilteredConversations] = useState(conversations);
  const [activeTab, setActiveTab] = useState<'messages' | 'contacts'>('messages');
  const { isAdmin } = useAdmin();
  const isMobile = useIsMobile();

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

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header - Mobile Optimized */}
      <header className="flex items-center justify-between px-3 py-2 border-b">
        <Logo variant={isMobile ? "icon" : "full"} />
        <div className="flex items-center gap-1">
          {isSearching ? (
            <div className="flex items-center relative">
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[180px] pr-8 h-9"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 h-9 w-9"
                onClick={() => {
                  setSearchQuery("");
                  setIsSearching(false);
                }}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setIsSearching(true)}
            >
              <Search className="h-4 w-4" />
            </Button>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'messages' ? (
          <div className="space-y-0.5">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  {...conversation}
                  onClick={() => handleConversationClick(conversation.id)}
                />
              ))
            ) : (
              <EmptyState
                icon={<Search className="h-6 w-6 text-muted-foreground" />}
                title="No conversations found"
                description={
                  searchQuery
                    ? `No results for "${searchQuery}"`
                    : "Start a new conversation"
                }
                action={
                  <Button
                    onClick={() => {
                      setSearchQuery("");
                      setIsSearching(false);
                    }}
                  >
                    Clear search
                  </Button>
                }
                className="h-[calc(100vh-10rem)]"
              />
            )}
          </div>
        ) : (
          <div className="h-[calc(100vh-10rem)]">
            <EmptyState
              icon={<Users className="h-6 w-6 text-muted-foreground" />}
              title="Contact list will appear here"
              description="This feature will be available in the next update"
            />
          </div>
        )}
      </div>

      {/* New Message Button - Mobile Optimized */}
      <div className="fixed right-4 bottom-20 z-10">
        <Button size="icon" className="h-12 w-12 rounded-full shadow-lg">
          <MessageSquarePlus className="h-5 w-5" />
        </Button>
      </div>

      {/* Bottom Navigation Bar - Mobile Optimized */}
      <div className="border-t bg-background py-2 px-4">
        <div className="grid grid-cols-4 gap-1">
          <Button
            variant={activeTab === 'messages' ? 'default' : 'ghost'}
            className="h-12 flex flex-col items-center justify-center space-y-1"
            onClick={() => setActiveTab('messages')}
          >
            <MessageSquarePlus className="h-5 w-5" />
            {!isMobile && <span className="text-xs">Messages</span>}
          </Button>
          <Button
            variant={activeTab === 'contacts' ? 'default' : 'ghost'}
            className="h-12 flex flex-col items-center justify-center space-y-1"
            onClick={() => setActiveTab('contacts')}
          >
            <Users className="h-5 w-5" />
            {!isMobile && <span className="text-xs">Contacts</span>}
          </Button>
          <Button
            variant="ghost"
            className="h-12 flex flex-col items-center justify-center space-y-1"
            onClick={() => navigate('/profile-setup')}
          >
            <Settings className="h-5 w-5" />
            {!isMobile && <span className="text-xs">Settings</span>}
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              className="h-12 flex flex-col items-center justify-center space-y-1"
              onClick={() => navigate('/admin')}
            >
              <Shield className="h-5 w-5" />
              {!isMobile && <span className="text-xs">Admin</span>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
