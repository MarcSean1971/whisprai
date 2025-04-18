
import { Logo } from "@/components/Logo";
import { BackButton } from '@/components/ui/back-button';

interface AdminHeaderProps {
  onExit: () => void;
  title?: string;
}

export function AdminHeader({ onExit, title }: AdminHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <BackButton onBack={onExit} />
        <Logo size="md" />
      </div>
      {title && (
        <h1 className="text-xl font-semibold">{title}</h1>
      )}
    </div>
  );
}
