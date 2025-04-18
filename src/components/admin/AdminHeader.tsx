
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface AdminHeaderProps {
  onExit: () => void;
}

export function AdminHeader({ onExit }: AdminHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onExit} 
        className="gap-2"
      >
        <LogOut className="h-4 w-4" />
        Exit
      </Button>
      
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
    </div>
  );
}
