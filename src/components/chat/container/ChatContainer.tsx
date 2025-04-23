
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatContainerProps {
  children: ReactNode;
}

export function ChatContainer({ children }: ChatContainerProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className={cn(
      "flex flex-col h-[100dvh] w-full bg-background overflow-hidden",
      "relative isolate"
    )}>
      {children}
    </div>
  );
}
