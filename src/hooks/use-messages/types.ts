
export interface Profile {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  language?: string;
}

export interface ParentMessage {
  id: string;
  content: string;
  created_at: string;
  sender: {
    id: string;
    profiles?: Profile | null;
  } | null;
}

export interface Message {
  id: string;
  content: string;
  created_at: string;
  conversation_id: string;
  sender_id: string | null;
  status: string;
  original_language?: string | null;
  metadata?: any;
  private_room?: string | null;
  private_recipient?: string | null;
  sender?: {
    id: string;
    profiles?: Profile;
  };
  parent?: ParentMessage | null;
}

export interface PaginatedMessagesResponse {
  messages: Message[];
  nextCursor: string | null;
}

export interface MessagePage {
  messages: Message[];
  nextCursor: string | null;
}
