
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

interface CallStreamProps {
  id: string;
  className?: string;
  muted?: boolean;
}

export interface CallStreamHandle {
  getElement: () => HTMLDivElement | null;
}

export const CallStream = forwardRef<CallStreamHandle, CallStreamProps>(
  ({ id, className = "", muted = false }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      getElement: () => containerRef.current,
    }));

    return (
      <div
        id={id}
        ref={containerRef}
        className={`overflow-hidden rounded-md ${className}`}
        data-muted={muted}
      />
    );
  }
);

CallStream.displayName = "CallStream";
