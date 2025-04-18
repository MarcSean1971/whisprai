
import { useState, useEffect } from "react";
import { ConversationItem } from "@/components/ConversationItem";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquarePlus, Search, Settings, Users, LogOut, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdmin } from "@/hooks/use-admin";

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

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header - Simplified */}
      <header className="flex items-center justify-between p-4 border-b">
        <Logo />
        <div className="flex items-center gap-2">
          {isSearching ? (
            <div className="flex items-center relative">
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 md:w-64 pr-8"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0"
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
              onClick={() => setIsSearching(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'messages' ? (
          <div className="p-4 space-y-1">
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
                className="h-full"
              />
            )}
          </div>
        ) : (
          <div className="p-4">
            <EmptyState
              icon={<Users className="h-6 w-6 text-muted-foreground" />}
              title="Contact list will appear here"
              description="This feature will be available in the next update"
              className="h-full"
            />
          </div>
        )}
      </div>

      {/* New Message Button - Repositioned */}
      <div className="absolute right-4 bottom-20 z-10">
        <Button size="lg" className="h-14 w-14 rounded-full shadow-lg">
          <MessageSquarePlus className="h-6 w-6" />
        </Button>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="border-t bg-background flex items-center justify-around p-4">
        <Button
          variant={activeTab === 'messages' ? 'default' : 'ghost'}
          className="flex-1 mx-1"
          onClick={() => setActiveTab('messages')}
        >
          <MessageSquarePlus className="h-5 w-5 mr-2" />
          Messages
        </Button>
        <Button
          variant={activeTab === 'contacts' ? 'default' : 'ghost'}
          className="flex-1 mx-1"
          onClick={() => setActiveTab('contacts')}
        >
          <Users className="h-5 w-5 mr-2" />
          Contacts
        </Button>
        <Button
          variant="ghost"
          className="flex-1 mx-1"
          onClick={() => navigate('/profile-setup')}
        >
          <Settings className="h-5 w-5 mr-2" />
          Settings
        </Button>
        {isAdmin && (
          <Button
            variant="ghost"
            className="flex-1 mx-1"
            onClick={() => navigate('/admin')}
          >
            <Shield className="h-5 w-5 mr-2" />
            Admin
          </Button>
        )}
      </div>
    </div>
  );
}
