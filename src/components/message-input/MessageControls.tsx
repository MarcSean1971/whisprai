import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, Paperclip, Smile, Camera, Sparkles, X } from "lucide-react";
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { useState, useEffect } from "react";
import { useToxicityAnalysis } from "@/hooks/use-toxicity-analysis";
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
  const { toxicityScore, analyzeToxicity } = useToxicityAnalysis();

  useEffect(() => {
    analyzeToxicity(message);
  }, [message, analyzeToxicity]);

  const getButtonStyle = () => {
    const baseStyle = "transition-all duration-300";
    if (!message.trim()) return baseStyle;

    // Calculate gradient based on toxicity score
    const green = `rgba(34, 197, 94, ${1 - toxicityScore / 100})`; // text-green-500
    const red = `rgba(239, 68, 68, ${toxicityScore / 100})`; // text-red-500
    
    return `${baseStyle} bg-gradient-to-r from-${green} to-${red}`;
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
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type a message..."
            className="pr-10 py-6 rounded-full"
            disabled={disabled}
          />
          
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
            className="rounded-full"
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
