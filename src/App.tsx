
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ProfileSetup from "./pages/ProfileSetup";
import Verify from "./pages/Verify";
import Admin from "./pages/Admin";
import Chats from "./pages/Chats";
import Chat from "./pages/Chat";
import Contacts from "./pages/Contacts";
import { toast } from "sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

const upsertUserPresence = async (userId?: string) => {
  if (!userId) return;
  try {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("user_presence")
      .upsert(
        {
          user_id: userId,
          last_seen_at: now,
          created_at: now,
        },
        { onConflict: "user_id" }
      );
    if (error) {
      console.error("[Presence][App] Failed to upsert user presence", error);
    } else {
      console.log("[Presence][App] User presence upserted for", userId);
    }
  } catch (err) {
    console.error("[Presence][App] Error upserting presence:", err);
  }
};

const App = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Create a memoized version of upsertUserPresence for this component
  const updatePresence = useCallback(() => {
    if (userId) {
      upsertUserPresence(userId);
    }
  }, [userId]);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const uid = data.user?.id || null;
        setUserId(uid);
        if (uid) {
          upsertUserPresence(uid);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        toast.error('Error initializing session');
      } finally {
        setIsInitializing(false);
      }
    };

    fetchUserId();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_OUT') {
        console.log('User signed out, cleaning up...');
        setUserId(null);
        queryClient.clear();
        window.location.href = '/auth';
      } else if (event === 'SIGNED_IN') {
        const uid = session?.user?.id || null;
        setUserId(uid);
        if (uid) {
          upsertUserPresence(uid);
        }
      }
    });

    // Enhanced presence interactions
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
      // Throttle update to once per minute
      if (!window.mouseMoveTimer) {
        window.mouseMoveTimer = setTimeout(() => {
          updatePresence();
          window.mouseMoveTimer = null;
        }, 60000); // Once per minute
      }
    };
    
    const handleClick = () => {
      updatePresence();
    };
    
    // Add additional event listeners for better presence detection
    window.addEventListener("focus", handleFocus);
    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);
    
    // Set up regular interval for presence heartbeat (every 40 seconds)
    const presenceInterval = setInterval(updatePresence, 40000);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
      clearInterval(presenceInterval);
      if (window.mouseMoveTimer) {
        clearTimeout(window.mouseMoveTimer);
      }
    };
  }, [userId, updatePresence]);

  if (isInitializing) {
    return null;
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="ui-theme">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <TooltipProvider>
            <div className="mx-auto max-w-2xl bg-background min-h-screen">
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/verify" element={<Verify />} />
                <Route path="/" element={<Navigate to="/chats" replace />} />
                <Route path="/home" element={<Navigate to="/chats" replace />} />
                <Route path="/profile-setup" element={
                  <ProtectedRoute>
                    <ProfileSetup />
                  </ProtectedRoute>
                } />
                <Route path="/chats" element={
                  <ProtectedRoute>
                    <Chats />
                  </ProtectedRoute>
                } />
                <Route path="/contacts" element={
                  <ProtectedRoute>
                    <Contacts />
                  </ProtectedRoute>
                } />
                <Route path="/chat/:id" element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </TooltipProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
