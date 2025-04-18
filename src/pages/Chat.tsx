import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/components/ChatMessage";
import { MessageInput } from "@/components/MessageInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, MoreVertical, Phone, Search, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { messages, contacts } from "@/lib/sample-data";

export type MessageType = {
  id: string;
  content: string;
  timestamp: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  status: "sending" | "sent" | "delivered" | "read";
  isAI?: boolean;
  translateTo?: string;
  translatedContent?: string;
};

export default function Chat() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [chatMessages, setChatMessages] = useState<MessageType[]>([]);
  const [suggestions, setSuggestions] = useState<{ id: string; text: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [contact, setContact] = useState<any>(null);

  useEffect(() => {
    const foundContact = contacts.find(c => c.id === id);
    setContact(foundContact);
    
    const conversationMessages = messages.filter(m => 
      m.conversationId === id
    );
    
    setChatMessages(conversationMessages);
    
    const smartSuggestions = [
      { id: "1", text: "Sure, that works for me" },
      { id: "2", text: "What time should we meet?" },
      { id: "3", text: "Can you send me the details?" }
    ];
    
    setSuggestions(smartSuggestions);
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendMessage = (content: string) => {
    const newMessage: MessageType = {
      id: Date.now().toString(),
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sender: {
        id: "me",
        name: "Me",
      },
      status: "sending",
    };
    
    setChatMessages([...chatMessages, newMessage]);
    
    setTimeout(() => {
      setChatMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: "sent" } 
            : msg
        )
      );
    }, 1000);
    
    setTimeout(() => {
      setChatMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: "delivered" } 
            : msg
        )
      );
    }, 2000);
    
    setTimeout(() => {
      const aiResponse: MessageType = {
        id: Date.now().toString(),
        content: "I understand. Let me help you with that.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sender: {
          id: "ai",
          name: "WhisprAI",
          avatar: "/placeholder.svg",
        },
        status: "delivered",
        isAI: true,
      };
      
      setChatMessages(prev => [...prev, aiResponse]);
      
      const newSuggestions = [
        { id: "1", text: "Thank you!" },
        { id: "2", text: "Can you explain in more detail?" },
        { id: "3", text: "What are the next steps?" }
      ];
      
      setSuggestions(newSuggestions);
    }, 3000);
  };

  const handleStartRecording = () => {
    alert("Voice recording feature will be implemented here");
  };

  if (!contact) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/home")}
            className="md:hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <Avatar className="h-10 w-10">
            <AvatarImage src={contact.avatar} alt={contact.name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {contact.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="ml-3">
            <h2 className="font-medium">{contact.name}</h2>
            <p className="text-xs text-muted-foreground">
              {contact.isOnline ? "Online" : "Last seen recently"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.map((message, index) => {
          const isOwn = message.sender.id === "me";
          const showSender = 
            !isOwn && 
            (index === 0 || chatMessages[index - 1].sender.id !== message.sender.id);
            
          return (
            <ChatMessage
              key={message.id}
              content={message.content}
              timestamp={message.timestamp}
              isOwn={isOwn}
              status={message.status}
              sender={message.sender}
              showSender={showSender}
              isAI={message.isAI}
              translateTo={message.translateTo}
              translatedContent={message.translatedContent}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      
      <div className={cn(
        "p-4 border-t transition-all",
        suggestions.length > 0 && "pb-6"
      )}>
        <MessageInput
          onSendMessage={handleSendMessage}
          onStartRecording={handleStartRecording}
          suggestions={suggestions}
        />
      </div>
    </div>
  );
}
