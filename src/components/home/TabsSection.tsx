
import { EmptyState } from "@/components/EmptyState";
import { Search, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactsList } from "@/components/contacts/ContactsList";
import { AddContactDialog } from "@/components/contacts/AddContactDialog";
import { ConversationItem } from "@/components/ConversationItem";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SentRequests } from "@/components/contacts/SentRequests";
import { ReceivedRequests } from "@/components/contacts/ReceivedRequests";
import { Skeleton } from "@/components/ui/skeleton";

interface TabsSectionProps {
  activeTab: 'chats' | 'contacts';
  filteredConversations: Array<any>;
  searchQuery: string;
  onConversationClick: (id: string) => void;
  onClearSearch: () => void;
  onTabChange: (value: string) => void;
  isLoading?: boolean;
  error?: Error | null;
}

export function TabsSection({
  activeTab,
  filteredConversations,
  searchQuery,
  onConversationClick,
  onClearSearch,
  onTabChange,
  isLoading = false,
  error = null,
}: TabsSectionProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsContent value="chats" className="mt-0">
        <div className="space-y-0.5">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-3 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
              <h3 className="font-medium mb-1">Error loading conversations</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {error instanceof Error ? error.message : 'Unknown error occurred'}
              </p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          ) : filteredConversations.length > 0 ? (
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
              <TabsTrigger value="sent" className="flex-1">Sent</TabsTrigger>
              <TabsTrigger value="received" className="flex-1">Received</TabsTrigger>
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

          <TabsContent value="sent" className="mt-0">
            <SentRequests />
          </TabsContent>

          <TabsContent value="received" className="mt-0">
            <ReceivedRequests />
          </TabsContent>
        </Tabs>
      </TabsContent>
    </Tabs>
  );
}
