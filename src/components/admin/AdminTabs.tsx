
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
      
      <TabsContent value="languages" className="w-full">
        <LanguageManagement />
      </TabsContent>
      
      <TabsContent value="ai" className="w-full">
        <AISettings />
      </TabsContent>

      <TabsContent value="users" className="w-full">
        <UserManagement />
      </TabsContent>

      <TabsContent value="instructions" className="w-full">
        <InstructionsManagement />
      </TabsContent>
    </Tabs>
  );
}
