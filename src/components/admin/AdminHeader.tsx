
import { Logo } from "@/components/Logo";

interface AdminHeaderProps {
  title?: string;
}

export function AdminHeader({ title }: AdminHeaderProps) {
  return (
    <header className="flex flex-col border-b">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Logo variant="full" />
          {title && (
            <h1 className="text-xl font-semibold">{title}</h1>
          )}
        </div>
      </div>
    </header>
  );
}

