
import { ReactNode } from "react";

interface MessagesContainerProps {
  children: ReactNode;
}

export function MessagesContainer({ children }: MessagesContainerProps) {
  return (
    <div className="absolute inset-0">
      {children}
    </div>
  );
}
