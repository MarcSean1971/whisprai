
import { Logo } from "@/components/Logo";

interface AdminHeaderProps {
  title?: string;
}

export function AdminHeader({ title }: AdminHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Logo size="md" />
      </div>
      {title && (
        <h1 className="text-xl font-semibold">{title}</h1>
      )}
    </div>
  );
}
