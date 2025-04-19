
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react"; 
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";
import ProfileSetup from "./pages/ProfileSetup";
import Verify from "./pages/Verify";
import Admin from "./pages/Admin";
import Chats from "./pages/Chats";
import Contacts from "./pages/Contacts";
import { CallInterface } from "@/components/call/CallInterface";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  useEffect(() => {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/verify" element={<Verify />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Chats />
              </ProtectedRoute>
            } />
            <Route path="/profile-setup" element={
              <ProtectedRoute>
                <ProfileSetup />
              </ProtectedRoute>
            } />
            <Route path="/home" element={
              <ProtectedRoute>
                <Chats />
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
          <CallInterface userId={null} />
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
