
import React, { useState } from "react";
import { Header } from "@/components/home/Header";
import { BottomNavigation } from "@/components/home/BottomNavigation";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/use-admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContactsList } from "@/components/contacts/ContactsList";
import { SentRequests } from "@/components/contacts/SentRequests";
import { ReceivedRequests } from "@/components/contacts/ReceivedRequests";
import { AddContactDialog } from "@/components/contacts/AddContactDialog";

export default function Contacts() {
  const navigate = useNavigate();
  const { isAdmin, loading: isAdminLoading } = useAdmin();
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("contacts");

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleSearchToggle = () => {
    setIsSearching(!isSearching);
    if (!isSearching) {
      setSearchQuery("");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header 
        isSearching={isSearching}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchToggle={handleSearchToggle}
        rightAction={<AddContactDialog />}
      />
      
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="contacts" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-2 border-b">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="contacts" className="flex-1">Contacts</TabsTrigger>
              <TabsTrigger value="sent" className="flex-1">Sent</TabsTrigger>
              <TabsTrigger value="received" className="flex-1">Received</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="contacts" className="mt-0">
            <ContactsList />
          </TabsContent>

          <TabsContent value="sent" className="mt-0">
            <SentRequests />
          </TabsContent>

          <TabsContent value="received" className="mt-0">
            <ReceivedRequests />
          </TabsContent>
        </Tabs>
      </div>
      
      <BottomNavigation 
        activeTab="contacts"
        isAdmin={isAdmin}
        isLoading={isAdminLoading}
      />
    </div>
  );
}
