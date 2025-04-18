import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdmin } from "@/hooks/use-admin";
import { Search } from "lucide-react";

// Components
import { ConversationItem } from "@/components/ConversationItem";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/home/Header";
import { BottomNavigation } from "@/components/home/BottomNavigation";
import { NewMessageButton } from "@/components/home/NewMessageButton";
import { ContactsList } from "@/components/contacts/ContactsList";
import { PendingRequests } from "@/components/contacts/PendingRequests";
import { AddContactDialog } from "@/components/contacts/AddContactDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    <div className="flex flex-col h-screen bg-background w-full max-w-full">
      <Header 
        isSearching={isSearching}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchToggle={() => setIsSearching(!isSearching)}
      />
      
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="messages" className="w-full">
          <div className="px-2 border-b">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="messages" className="flex-1">Messages</TabsTrigger>
              <TabsTrigger value="contacts" className="flex-1">Contacts</TabsTrigger>
              <TabsTrigger value="pending" className="flex-1">Pending</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="messages" className="mt-0">
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
                    searchQuery ? (
                      <Button
                        onClick={() => {
                          setSearchQuery("");
                          setIsSearching(false);
                        }}
                      >
                        Clear search
                      </Button>
                    ) : undefined
                  }
                  className="h-[calc(100vh-8rem)]"
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="contacts" className="mt-0 relative">
            <div className="absolute right-4 top-4">
              <AddContactDialog />
            </div>
            <ContactsList />
          </TabsContent>

          <TabsContent value="pending" className="mt-0">
            <PendingRequests />
          </TabsContent>
        </Tabs>
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
