
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isMobile } = useIsMobile();

  return (
    <div className={cn(
      "bg-background min-h-screen w-full",
      !window.location.pathname.includes('/chat/') && !isMobile && "mx-auto max-w-2xl px-4",
      isMobile && "pb-[72px]" // Add padding at the bottom for the navigation bar
    )}>
      {children}
    </div>
  );
}
