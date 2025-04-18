import { useState, useEffect } from "react";
import { ConversationItem } from "@/components/ConversationItem";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, MessageSquarePlus, Search, Settings, Users, X, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Sample data
import { conversations } from "@/lib/sample-data";

export default function Home() {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredConversations, setFilteredConversations] = useState(conversations);

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
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b">
        <Logo />
        
        <div className="flex items-center gap-2">
          {isSearching ? (
            <div className="flex items-center relative">
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pr-8"
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
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearching(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Search className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
              >
                <Bell className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-5 w-5" />
              </Button>
              <ThemeToggle />
            </>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="messages" className="h-full flex flex-col">
          <TabsList className="mx-4 mt-4 grid w-auto grid-cols-2">
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="messages" className="flex-1 overflow-hidden">
            <div className="p-4 h-full overflow-y-auto space-y-1">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    id={conversation.id}
                    name={conversation.name}
                    avatar={conversation.avatar}
                    lastMessage={conversation.lastMessage}
                    timestamp={conversation.timestamp}
                    unreadCount={conversation.unreadCount}
                    isPinned={conversation.isPinned}
                    isGroup={conversation.isGroup}
                    participants={conversation.participants}
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
                      : "Start a new conversation or join a group"
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
          </TabsContent>
          
          <TabsContent value="contacts" className="flex-1 overflow-hidden">
            <div className="p-4 h-full overflow-y-auto">
              <EmptyState
                icon={<Users className="h-6 w-6 text-muted-foreground" />}
                title="Contact list will appear here"
                description="This feature will be available in the next update"
                className="h-full"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* New Message Button */}
      <div className="absolute bottom-6 right-6">
        <Button size="lg" className="h-14 w-14 rounded-full shadow-lg">
          <MessageSquarePlus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
