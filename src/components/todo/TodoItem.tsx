import React, { useState } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Todo } from "@/hooks/use-todos";
import { format } from "date-fns";
import { MessageSquare, Link, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TodoEditor } from "./TodoEditor";
import { Button } from "../ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TodoItemProps {
  todo: Todo & { 
    profiles: { first_name: string | null; last_name: string | null },
    conversation_participants?: Array<{ id: string; first_name: string | null; last_name: string | null }>
  };
  onStatusChange: (id: string, status: 'pending' | 'completed') => void;
  onUpdate: (id: string, data: { 
    assigned_to?: string; 
    due_date?: Date; 
    status?: 'pending' | 'completed';
    comment?: string;
  }) => void;
  onDelete: (id: string) => void;
}

export function TodoItem({ todo, onStatusChange, onUpdate, onDelete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const formattedDate = format(new Date(todo.due_date), 'MMM d, yyyy');
  
  const navigateToMessage = () => {
    navigate(`/chat/${todo.conversation_id}?message=${todo.message_id}`);
  };

  const messageContent = todo.messages?.content || todo.message_content || todo.message_id;
  const assigneeName = todo.profiles.first_name 
    ? `${todo.profiles.first_name} ${todo.profiles.last_name || ''}`
    : 'Unknown';

  const counterpartyNames = todo.conversation_participants && todo.conversation_participants.length > 0
    ? todo.conversation_participants
        .map(participant => participant.first_name 
          ? `${participant.first_name} ${participant.last_name || ''}` 
          : 'Unknown'
        )
        .join(', ')
    : 'Unknown chat';

  return (
    <div className="space-y-2">
      <div className="flex items-start space-x-2 p-3 hover:bg-whispr-purple-light/10 hover:text-whispr-purple-dark rounded-lg transition-colors duration-200 ease-in-out">
        <Checkbox
          checked={todo.status === 'completed'}
          onCheckedChange={(checked) => {
            onStatusChange(todo.id, checked ? 'completed' : 'pending');
          }}
        />
        <div className="flex-1 space-y-1 cursor-pointer" onClick={() => setIsEditing(true)}>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className={`text-sm ${todo.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                {messageContent}
              </p>
              <p className="text-sm text-muted-foreground">Assigned to: {assigneeName}</p>
              <p className="text-sm text-muted-foreground">From chat with: {counterpartyNames}</p>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateToMessage();
                }}
              >
                <Link className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-red-600"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Todo</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this todo? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => onDelete(todo.id)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Due: {formattedDate}</p>
            {todo.comment && (
              <div className="flex items-start gap-1 mt-2">
                <MessageSquare className="h-4 w-4 mt-0.5" />
                <p className="flex-1">{todo.comment}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="border rounded-lg mt-2">
          <TodoEditor
            todo={todo}
            onUpdate={(data) => onUpdate(todo.id, data)}
            onClose={() => setIsEditing(false)}
          />
        </div>
      )}
    </div>
  );
}
