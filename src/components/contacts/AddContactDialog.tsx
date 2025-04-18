
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
import { Input } from "@/components/ui/input";
import { UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function AddContactDialog() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get the current user's ID
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('Not authenticated');
      }

      // Since we can't directly query auth.users, we'll use a more direct approach
      // First fetch all user IDs from contact_requests to find if the user exists
      const { data: userExists, error: userExistsError } = await supabase.rpc(
        'get_user_id_by_email',
        { email_to_find: email }
      );

      // If RPC function doesn't exist or fails, provide a fallback approach
      if (userExistsError || !userExists) {
        toast.error('User not found with this email address');
        setIsSubmitting(false);
        return;
      }

      // Create the contact request with recipient_id
      const { error } = await supabase
        .from('contact_requests')
        .insert({
          sender_id: userData.user.id,
          recipient_id: userExists,
          recipient_email: email // Keep this for backward compatibility
        });

      if (error) throw error;

      toast.success('Contact request sent successfully');
      setOpen(false);
      setEmail('');
    } catch (error) {
      console.error('Error sending contact request:', error);
      toast.error('Failed to send contact request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Contact
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
          <DialogDescription>
            Enter the email address of the person you want to connect with.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Request'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
