
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserProfileDialog } from './UserProfileDialog';
import { MoreVertical, Shield, ShieldOff, UserCog } from 'lucide-react';

interface User {
  id: string;
  email?: string;
  created_at: string;
  banned_until?: string | null;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data: { users }, error } = await supabase.functions.invoke('list-users');
      if (error) throw error;
      setUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'suspend' | 'unsuspend') => {
    try {
      setIsUpdating(true);
      const { error } = await supabase.functions.invoke('manage-user', {
        body: { userId, action }
      });
      
      if (error) throw error;
      
      toast.success(`User ${action === 'suspend' ? 'suspended' : 'unsuspended'} successfully`);
      loadUsers(); // Refresh the user list
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      toast.error(`Failed to ${action} user`);
    } finally {
      setIsUpdating(false);
      setSelectedUser(null);
    }
  };

  const isUserSuspended = (user: User) => {
    return user.banned_until && new Date(user.banned_until) > new Date();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.email || 'No email'}</TableCell>
              <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                  isUserSuspended(user) ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {isUserSuspended(user) ? 'Suspended' : 'Active'}
                </span>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedUser(user);
                        setIsProfileOpen(true);
                      }}
                    >
                      <UserCog className="mr-2 h-4 w-4" />
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedUser(user);
                        handleUserAction(
                          user.id,
                          isUserSuspended(user) ? 'unsuspend' : 'suspend'
                        );
                      }}
                    >
                      {isUserSuspended(user) ? (
                        <>
                          <ShieldOff className="mr-2 h-4 w-4" />
                          Unsuspend
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-4 w-4" />
                          Suspend
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <UserProfileDialog 
        userId={selectedUser?.id || null}
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
      />
    </div>
  );
}
