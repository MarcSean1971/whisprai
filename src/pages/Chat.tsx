
import { useParams, useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useEffect } from "react";
import { ChatContent } from "@/components/chat/content/ChatContent";

export default function Chat() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  useEffect(() => {
    if (!id) {
      console.error("No conversation ID provided");
      navigate("/chats", { replace: true });
    }
  }, [id, navigate]);
  
  if (!id) {
    return (
      <div className="flex items-center justify-center h-screen">
        <AlertCircle className="h-10 w-10 text-destructive mr-2" />
        <p>Invalid conversation ID. Redirecting...</p>
      </div>
    );
  }
  
  return (
    <ErrorBoundary>
      <ChatContent conversationId={id} />
    </ErrorBoundary>
  );
}
