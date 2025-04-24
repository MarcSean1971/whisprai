
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
      "min-h-screen w-full bg-background",
      !window.location.pathname.includes('/chat/') && !isMobile && "mx-auto max-w-2xl",
      isMobile ? "pb-[72px]" : "px-0" // Adjust padding based on mobile/desktop
    )}>
      {children}
    </div>
  );
}
