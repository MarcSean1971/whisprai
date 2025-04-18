
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LanguageManagement } from './LanguageManagement';
import { AISettings } from './AISettings';
import { UserManagement } from './UserManagement';
import { InstructionsManagement } from './InstructionsManagement';

export function AdminTabs() {
  return (
    <Tabs defaultValue="languages" className="w-full max-w-full">
      <TabsList className="flex w-full">
        <TabsTrigger value="languages" className="flex-1">Languages</TabsTrigger>
        <TabsTrigger value="ai" className="flex-1">AI Settings</TabsTrigger>
        <TabsTrigger value="users" className="flex-1">Users</TabsTrigger>
        <TabsTrigger value="instructions" className="flex-1">Instructions</TabsTrigger>
      </TabsList>
      
      <TabsContent value="languages" className="w-full space-y-6">
        <h2 className="text-xl font-semibold">Language Management</h2>
        <LanguageManagement />
      </TabsContent>
      
      <TabsContent value="ai" className="w-full space-y-6">
        <h2 className="text-xl font-semibold">AI Settings</h2>
        <AISettings />
      </TabsContent>

      <TabsContent value="users" className="w-full space-y-6">
        <h2 className="text-xl font-semibold">User Management</h2>
        <UserManagement />
      </TabsContent>

      <TabsContent value="instructions" className="w-full space-y-6">
        <h2 className="text-xl font-semibold">Instructions Management</h2>
        <InstructionsManagement />
      </TabsContent>
    </Tabs>
  );
}
