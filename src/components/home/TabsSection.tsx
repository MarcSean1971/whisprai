
import { EmptyState } from "@/components/EmptyState";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactsList } from "@/components/contacts/ContactsList";
import { PendingRequests } from "@/components/contacts/PendingRequests";
import { AddContactDialog } from "@/components/contacts/AddContactDialog";
import { ConversationItem } from "@/components/ConversationItem";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TabsSectionProps {
  activeTab: 'chats' | 'contacts';
  filteredConversations: Array<any>;
  searchQuery: string;
  onConversationClick: (id: string) => void;
  onClearSearch: () => void;
  onTabChange: (value: string) => void;
}

export function TabsSection({
  activeTab,
  filteredConversations,
  searchQuery,
  onConversationClick,
  onClearSearch,
  onTabChange,
}: TabsSectionProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsContent value="chats" className="mt-0">
        <div className="space-y-0.5">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                {...conversation}
                onClick={() => onConversationClick(conversation.id)}
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
                  <Button onClick={onClearSearch}>Clear search</Button>
                ) : undefined
              }
              className="h-[calc(100vh-8rem)]"
            />
          )}
        </div>
      </TabsContent>

      <TabsContent value="contacts" className="mt-0">
        <Tabs defaultValue="contacts" className="w-full">
          <div className="px-2 border-b">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="contacts" className="flex-1">Contacts</TabsTrigger>
              <TabsTrigger value="pending" className="flex-1">Pending</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="contacts" className="mt-0">
            <div className="relative">
              <div className="absolute right-4 top-4">
                <AddContactDialog />
              </div>
              <ContactsList />
            </div>
          </TabsContent>

          <TabsContent value="pending" className="mt-0">
            <PendingRequests />
          </TabsContent>
        </Tabs>
      </TabsContent>
    </Tabs>
  );
}
