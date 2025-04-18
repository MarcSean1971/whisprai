import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { messages, contacts } from "@/lib/sample-data";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";

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
  const { id } = useParams<{ id: string }>();
  const [chatMessages, setChatMessages] = useState<MessageType[]>([]);
  const [suggestions, setSuggestions] = useState<{ id: string; text: string }[]>([]);
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
      <ChatHeader contact={contact} />
      <ChatMessages messages={chatMessages} />
      <ChatInput
        onSendMessage={handleSendMessage}
        onStartRecording={handleStartRecording}
        suggestions={suggestions}
      />
    </div>
  );
}
