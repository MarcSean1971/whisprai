
import { Logo } from "@/components/Logo";
import { useIsMobile } from "@/hooks/use-mobile";

interface AdminHeaderProps {
  title?: string;
}

export function AdminHeader({ title }: AdminHeaderProps) {
  const isMobile = useIsMobile();

  return (
    <header className="flex flex-col border-b">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Logo variant={isMobile ? "icon" : "full"} />
          {title && (
            <h1 className="text-xl font-semibold">{title}</h1>
          )}
        </div>
      </div>
    </header>
  );
}
