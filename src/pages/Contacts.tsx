
import { Header } from "@/components/home/Header";
import { BottomNavigation } from "@/components/home/BottomNavigation";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/use-admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContactsList } from "@/components/contacts/ContactsList";
import { PendingRequests } from "@/components/contacts/PendingRequests";
import { AddContactDialog } from "@/components/contacts/AddContactDialog";
import { Logo } from "@/components/Logo";

export default function Contacts() {
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  
  return (
    <div className="flex flex-col h-screen bg-background w-full max-w-full">
      <div className="flex items-center gap-4 px-4 py-3 border-b">
        <Logo variant="full" />
      </div>

      <Header 
        isSearching={false}
        searchQuery=""
        onSearchChange={() => {}}
        onSearchToggle={() => {}}
      />
      
      <div className="flex-1 overflow-y-auto">
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
      </div>

      <BottomNavigation 
        activeTab="contacts"
        onLogout={() => navigate("/")}
        isAdmin={isAdmin}
      />
    </div>
  );
}
