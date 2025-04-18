
import { Logo } from "@/components/Logo";
import { BackButton } from '@/components/ui/back-button';

interface AdminHeaderProps {
  onExit: () => void;
}

export function AdminHeader({ onExit }: AdminHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <BackButton onBack={onExit} />
      <Logo size="md" />
    </div>
  );
}
