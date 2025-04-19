
export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  language: string;
}

export interface Participant {
  user_id: string;
  profile?: Profile;
}

export interface LastMessage {
  content: string;
  created_at: string;
  sender_id: string;
}

export interface Conversation {
  id: string;
  is_group: boolean;
  created_at: string;
  updated_at: string;
  participants: Participant[];
  lastMessage?: LastMessage;
  name?: string;
  avatar?: string | null;
}
