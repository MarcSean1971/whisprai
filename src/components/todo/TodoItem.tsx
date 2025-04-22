
import React, { useState } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Todo } from "@/hooks/use-todos";
import { format } from "date-fns";
import { MessageSquare, Link, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TodoEditor } from "./TodoEditor";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
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
    creator_profile?: { first_name: string | null; last_name: string | null },
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

  const messageContent = todo.messages?.content || todo.message_content;
  const assigneeName = todo.profiles.first_name 
    ? `${todo.profiles.first_name} ${todo.profiles.last_name || ''}`
    : 'Unknown';
  const creatorName = todo.creator_profile?.first_name
    ? `${todo.creator_profile.first_name} ${todo.creator_profile.last_name || ''}`
    : 'Unknown';

  const counterpartyNames = todo.conversation_participants && todo.conversation_participants.length > 0
    ? todo.conversation_participants
        .map(participant => participant.first_name 
          ? `${participant.first_name} ${participant.last_name || ''}` 
          : 'Unknown'
        )
        .join(', ')
    : 'Unknown chat';

  const isOverdue = new Date(todo.due_date) < new Date() && todo.status === 'pending';
  const isDueSoon = new Date(todo.due_date).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000 && todo.status === 'pending';

  return (
    <div className={`rounded-lg border ${todo.status === 'completed' ? 'bg-muted/30' : 'bg-card'} transition-colors`}>
      <div className="p-4 space-y-4">
        <div className="flex items-start gap-3">
          <Checkbox
            className="mt-1"
            checked={todo.status === 'completed'}
            onCheckedChange={(checked) => {
              onStatusChange(todo.id, checked ? 'completed' : 'pending');
            }}
          />
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <p className={`text-sm sm:text-base ${todo.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                {messageContent}
              </p>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={navigateToMessage}
                >
                  <Link className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
                        className="bg-destructive hover:bg-destructive/90"
                        onClick={() => onDelete(todo.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant={isOverdue ? "destructive" : isDueSoon ? "default" : "secondary"}>
                {formattedDate}
              </Badge>
              <Badge variant="outline">
                {assigneeName}
              </Badge>
              {todo.comment && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  <span>{todo.comment}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-2">
              <span>Created by {creatorName}</span>
              <span>•</span>
              <span>{counterpartyNames}</span>
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="border-t">
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
