import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Mic, Send, Paperclip, Smile, Camera, Sparkles, X } from "lucide-react";
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { useToxicityAnalysis } from "@/hooks/use-toxicity-analysis";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface MessageControlsProps {
  message: string;
  onChange: (value: string) => void;
  onStartRecording: () => void;
  onAttachmentClick: () => void;
  onCameraClick: () => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  canAttach?: boolean;
}

export function MessageControls({
  message,
  onChange,
  onStartRecording,
  onAttachmentClick,
  onCameraClick,
  onSubmit,
  disabled,
  inputRef,
  canAttach = true
}: MessageControlsProps) {
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [lastToxicityScore, setLastToxicityScore] = useState(0);
  const { toxicityScore, isAnalyzing, analyzeToxicity } = useToxicityAnalysis();

  useEffect(() => {
    if (message.trim()) {
      analyzeToxicity(message);
    }
  }, [message, analyzeToxicity]);

  useEffect(() => {
    if (!isAnalyzing && toxicityScore !== undefined) {
      setLastToxicityScore(toxicityScore);
    }
  }, [toxicityScore, isAnalyzing]);

  const getButtonStyle = () => {
    if (!message.trim()) {
      if (lastToxicityScore > 0) {
        return getColorForScore(lastToxicityScore);
      }
      return "bg-gradient-to-r from-[#9b87f5] to-[#7C4DFF] text-white hover:opacity-90 transition-all duration-300";
    }

    if (isAnalyzing) {
      return getColorForScore(lastToxicityScore);
    }

    return getColorForScore(toxicityScore);
  };

  const getColorForScore = (score: number) => {
    let baseColor = "";
    if (score <= 20) {
      baseColor = "bg-gradient-to-r from-[#4ade80] to-[#10b981]";
    } else if (score <= 40) {
      baseColor = "bg-gradient-to-r from-[#fbbf24] to-[#f59e0b]";
    } else if (score <= 60) {
      baseColor = "bg-gradient-to-r from-[#fb923c] to-[#f97316]";
    } else if (score <= 80) {
      baseColor = "bg-gradient-to-r from-[#f87171] to-[#ef4444]";
    } else {
      baseColor = "bg-gradient-to-r from-[#dc2626] to-[#b91c1c]";
    }
    
    return `${baseColor} text-white transition-all duration-300 ease-in-out hover:opacity-90`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (toxicityScore > 50) {
      setShowWarning(true);
    } else {
      onSubmit(e);
    }
  };

  const handleConfirmSend = () => {
    setShowWarning(false);
    onSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  const handleEmojiSelect = (emojiData: EmojiClickData) => {
    onChange(message + emojiData.emoji);
    setIsEmojiPickerOpen(false);
  };

  const handleEnhanceMessage = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message to enhance");
      return;
    }

    setIsEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-message', {
        body: { message: message.trim() }
      });

      if (error) throw error;
      if (!data?.enhancedMessage) throw new Error('No enhanced message received');

      onChange(data.enhancedMessage);
      toast.success("Message enhanced!");
    } catch (error) {
      console.error('Error enhancing message:', error);
      toast.error("Failed to enhance message. Please try again.");
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex gap-2 items-center relative">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
          onClick={onAttachmentClick}
          disabled={disabled || !canAttach}
          title="Attach files (images, documents, etc.)"
        >
          <Paperclip className="h-5 w-5" />
          <span className="sr-only">Attach files</span>
        </Button>
        
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
          onClick={onCameraClick}
          disabled={disabled || !canAttach}
          title="Take a photo"
        >
          <Camera className="h-5 w-5" />
          <span className="sr-only">Use camera</span>
        </Button>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-50"
          onClick={handleEnhanceMessage}
          disabled={disabled || isEnhancing || !message.trim()}
          title="Enhance message with AI"
        >
          <Sparkles className={`h-5 w-5 ${isEnhancing ? 'animate-pulse' : ''}`} />
          <span className="sr-only">Enhance message</span>
        </Button>
        
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => {
              onChange(e.target.value);
            }}
            placeholder="Type a message..."
            className={cn(
              "pr-10 py-6 rounded-full",
              isAnalyzing && "pr-16"
            )}
            disabled={disabled}
          />
          {isAnalyzing && (
            <div className="absolute right-12 top-1/2 -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}
          
          <Popover 
            open={isEmojiPickerOpen}
            onOpenChange={setIsEmojiPickerOpen}
            modal={true}
          >
            <PopoverTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={disabled}
              >
                <Smile className="h-5 w-5" />
                <span className="sr-only">Add emoji</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-full p-4 z-[100]" 
              align="end"
              side="top"
              sideOffset={5}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Choose an emoji</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsEmojiPickerOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
              <EmojiPicker
                width={300}
                height={350}
                onEmojiClick={handleEmojiSelect}
                lazyLoadEmojis={true}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {message.trim() ? (
          <Button 
            type="submit" 
            size="icon" 
            className={`rounded-full ${getButtonStyle()}`}
            disabled={disabled}
          >
            <Send className="h-5 w-5" />
            <span className="sr-only">Send message</span>
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            className={`rounded-full ${getButtonStyle()}`}
            onClick={onStartRecording}
            disabled={disabled}
          >
            <Mic className="h-5 w-5" />
            <span className="sr-only">Record voice message</span>
          </Button>
        )}
      </form>

      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aggressive Content Warning</AlertDialogTitle>
            <AlertDialogDescription>
              This message appears to be quite aggressive (toxicity score: {toxicityScore}%). Are you sure you want to send it?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSend} className="bg-red-500 hover:bg-red-600">
              Send Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
