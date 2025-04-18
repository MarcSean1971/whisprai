
// Types
export type ContactType = {
  id: string;
  name: string;
  avatar?: string;
  email: string;
  isOnline?: boolean;
  lastSeen?: string;
};

export type ConversationType = {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  timestamp?: string;
  unreadCount: number;
  isPinned: boolean;
  isGroup: boolean;
  participants: Array<{ name: string; avatar?: string }>;
};

export type MessageType = {
  id: string;
  conversationId: string;
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

// Sample data
export const contacts: ContactType[] = [
  {
    id: "1",
    name: "Emma Johnson",
    avatar: "/placeholder.svg",
    email: "emma.johnson@example.com",
    isOnline: true,
  },
  {
    id: "2",
    name: "Liam Smith",
    avatar: "/placeholder.svg",
    email: "liam.smith@example.com",
    isOnline: false,
    lastSeen: "2 hours ago",
  },
  {
    id: "3",
    name: "Olivia Davis",
    avatar: "/placeholder.svg",
    email: "olivia.davis@example.com",
    isOnline: true,
  },
  {
    id: "4",
    name: "Noah Wilson",
    avatar: "/placeholder.svg",
    email: "noah.wilson@example.com",
    isOnline: false,
    lastSeen: "yesterday",
  },
  {
    id: "5",
    name: "Sophia Taylor",
    avatar: "/placeholder.svg",
    email: "sophia.taylor@example.com",
    isOnline: true,
  },
];

export const conversations: ConversationType[] = [
  {
    id: "1",
    name: "Emma Johnson",
    avatar: "/placeholder.svg",
    lastMessage: "Sure, I'll send you the report by tomorrow",
    timestamp: "10:42 AM",
    unreadCount: 2,
    isPinned: true,
    isGroup: false,
    participants: [{ name: "Emma Johnson", avatar: "/placeholder.svg" }],
  },
  {
    id: "2",
    name: "Marketing Team",
    lastMessage: "Alex: Let's discuss the new campaign",
    timestamp: "Yesterday",
    unreadCount: 0,
    isPinned: false,
    isGroup: true,
    participants: [
      { name: "Alex Brown", avatar: "/placeholder.svg" },
      { name: "Jessica Lee", avatar: "/placeholder.svg" },
      { name: "Michael Chen", avatar: "/placeholder.svg" },
      { name: "Sara Johnson", avatar: "/placeholder.svg" },
    ],
  },
  {
    id: "3",
    name: "Liam Smith",
    avatar: "/placeholder.svg",
    lastMessage: "Are we still meeting this afternoon?",
    timestamp: "Yesterday",
    unreadCount: 0,
    isPinned: false,
    isGroup: false,
    participants: [{ name: "Liam Smith", avatar: "/placeholder.svg" }],
  },
  {
    id: "4",
    name: "Design Workshop",
    lastMessage: "You: Let me check the schedule",
    timestamp: "Monday",
    unreadCount: 0,
    isPinned: false,
    isGroup: true,
    participants: [
      { name: "Olivia Davis", avatar: "/placeholder.svg" },
      { name: "Noah Wilson", avatar: "/placeholder.svg" },
      { name: "Sophia Taylor", avatar: "/placeholder.svg" },
    ],
  },
  {
    id: "5",
    name: "Olivia Davis",
    avatar: "/placeholder.svg",
    lastMessage: "Thanks for your help!",
    timestamp: "Monday",
    unreadCount: 0,
    isPinned: false,
    isGroup: false,
    participants: [{ name: "Olivia Davis", avatar: "/placeholder.svg" }],
  },
];

export const messages: MessageType[] = [
  {
    id: "1",
    conversationId: "1",
    content: "Hi there! How are you doing today?",
    timestamp: "10:30 AM",
    sender: {
      id: "1",
      name: "Emma Johnson",
      avatar: "/placeholder.svg",
    },
    status: "read",
  },
  {
    id: "2",
    conversationId: "1",
    content: "I'm good, thanks for asking! Just working on the quarterly report.",
    timestamp: "10:32 AM",
    sender: {
      id: "me",
      name: "Me",
    },
    status: "read",
  },
  {
    id: "3",
    conversationId: "1",
    content: "Oh great! When do you think you'll have it ready?",
    timestamp: "10:35 AM",
    sender: {
      id: "1",
      name: "Emma Johnson",
      avatar: "/placeholder.svg",
    },
    status: "read",
  },
  {
    id: "4",
    conversationId: "1",
    content: "I should be able to finish it by tomorrow afternoon. Would that work for you?",
    timestamp: "10:38 AM",
    sender: {
      id: "me",
      name: "Me",
    },
    status: "read",
  },
  {
    id: "5",
    conversationId: "1",
    content: "Sure, I'll send you the report by tomorrow",
    timestamp: "10:42 AM",
    sender: {
      id: "1",
      name: "Emma Johnson",
      avatar: "/placeholder.svg",
    },
    status: "read",
  },
  {
    id: "6",
    conversationId: "3",
    content: "Hey, are we still on for the meeting at 3pm?",
    timestamp: "9:25 AM",
    sender: {
      id: "3",
      name: "Liam Smith",
      avatar: "/placeholder.svg",
    },
    status: "read",
  },
  {
    id: "7",
    conversationId: "3",
    content: "Yes, I'll be there. Do you want to discuss anything specific?",
    timestamp: "9:30 AM",
    sender: {
      id: "me",
      name: "Me",
    },
    status: "read",
  },
  {
    id: "8",
    conversationId: "3",
    content: "I'd like to go over the new design concepts and get your feedback.",
    timestamp: "9:32 AM",
    sender: {
      id: "3",
      name: "Liam Smith",
      avatar: "/placeholder.svg",
    },
    status: "read",
  },
  {
    id: "9",
    conversationId: "3",
    content: "Are we still meeting this afternoon?",
    timestamp: "Yesterday",
    sender: {
      id: "3",
      name: "Liam Smith",
      avatar: "/placeholder.svg",
    },
    status: "read",
  },
];
