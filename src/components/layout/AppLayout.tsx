
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className={cn(
      "bg-background min-h-screen",
      !window.location.pathname.includes('/chat/') && "mx-auto max-w-2xl"
    )}>
      {children}
    </div>
  );
}
