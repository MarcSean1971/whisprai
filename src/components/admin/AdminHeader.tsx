
import { BackButton } from '@/components/ui/back-button';

interface AdminHeaderProps {
  onExit: () => void;
}

export function AdminHeader({ onExit }: AdminHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <BackButton onBack={onExit} />
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
    </div>
  );
}
