
import { Message } from "@/hooks/use-messages";

export interface Todo {
  id: string;
  message_id: string;
  message_content: string | null;
  messages: {
    content: string;
  } | null;
  creator_id: string;
  assigned_to: string;
  due_date: string;
  conversation_id: string;
  status: 'pending' | 'completed';
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTodoInput {
  message_id: string;
  message_content: string;
  assigned_to: string;
  due_date: Date;
  conversation_id: string;
}

export interface UpdateTodoInput {
  id: string;
  assigned_to?: string;
  due_date?: Date;
  status?: 'pending' | 'completed';
  comment?: string;
}

export interface EnrichedTodo extends Todo {
  profiles: {
    first_name: string | null;
    last_name: string | null;
  };
  conversation_participants?: Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
  }>;
}
