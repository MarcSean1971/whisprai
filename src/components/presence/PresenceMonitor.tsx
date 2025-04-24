
import { useEffect, useRef } from "react";
import { usePresence } from "@/hooks/use-presence";

interface PresenceMonitorProps {
  userId: string | null;
}

export function PresenceMonitor({ userId }: PresenceMonitorProps) {
  const { updatePresence } = usePresence(userId);
  const mouseMoveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!userId) return;

    const handleFocus = () => {
      updatePresence();
      console.log("[Presence][App] Upsert on window focus");
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updatePresence();
        console.log("[Presence][App] Upsert on visibility change to visible");
      }
    };
    
    const handleMouseMove = () => {
      if (!mouseMoveTimerRef.current) {
        mouseMoveTimerRef.current = setTimeout(() => {
          updatePresence();
          mouseMoveTimerRef.current = null;
        }, 60000); // Once per minute
      }
    };
    
    const handleClick = () => {
      updatePresence();
    };
    
    window.addEventListener("focus", handleFocus);
    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);
    
    const presenceInterval = setInterval(updatePresence, 40000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
      clearInterval(presenceInterval);
      if (mouseMoveTimerRef.current) {
        clearTimeout(mouseMoveTimerRef.current);
      }
    };
  }, [userId, updatePresence]);

  return null;
}
