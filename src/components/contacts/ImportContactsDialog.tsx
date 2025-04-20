import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function ImportContactsDialog() {
  const [open, setOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const contacts = await parseCSVFile(file);
      await importContacts(contacts);
      toast.success('Contacts imported successfully');
      setOpen(false);
    } catch (error) {
      console.error('Error importing contacts:', error);
      toast.error('Failed to import contacts');
    } finally {
      setIsImporting(false);
    }
  };

  const parseCSVFile = async (file: File): Promise<Array<{ email: string }>> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const rows = text.split('\n');
          const contacts = rows
            .filter(row => row.trim()) // Skip empty rows
            .map(row => {
              const email = row.trim();
              if (!email.includes('@')) throw new Error(`Invalid email: ${email}`);
              return { email };
            });
          resolve(contacts);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const importContacts = async (contacts: Array<{ email: string }>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    for (const contact of contacts) {
      // Use the RPC function to get the recipient's ID
      const { data: recipientId } = await supabase
        .rpc('get_user_id_by_email', { 
          email_to_find: contact.email 
        });

      if (recipientId) {
        await supabase.from('contact_requests').insert({
          sender_id: user.id,
          recipient_id: recipientId,
          recipient_email: contact.email
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Contacts</DialogTitle>
          <DialogDescription>
            Upload a CSV file containing email addresses, one per line.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileUpload}
            disabled={isImporting}
            className="w-full"
          />
          {isImporting && (
            <div className="text-sm text-muted-foreground">
              Importing contacts...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
