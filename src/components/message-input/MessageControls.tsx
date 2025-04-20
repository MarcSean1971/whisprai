
import React, { useState } from "react";
import { AttachmentControls } from "./controls/AttachmentControls";
import { EnhanceButton } from "./controls/EnhanceButton";
import { MessageField } from "./controls/MessageField";
import { SendButton } from "./controls/SendButton";
import { WarningDialog } from "./controls/WarningDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  disabled = false,
  inputRef,
  canAttach = true
}: MessageControlsProps) {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toxicityScore, setToxicityScore] = useState(0);
  const [lastToxicityScore, setLastToxicityScore] = useState(0);

  // Utility function to get button style based on toxicity score
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
    const colors = {
      low: "bg-gradient-to-r from-[#4ade80] to-[#10b981]",
      medium: "bg-gradient-to-r from-[#fbbf24] to-[#f59e0b]",
      high: "bg-gradient-to-r from-[#fb923c] to-[#f97316]",
      very_high: "bg-gradient-to-r from-[#f87171] to-[#ef4444]",
      extreme: "bg-gradient-to-r from-[#dc2626] to-[#b91c1c]"
    };

    if (score <= 20) return `${colors.low} text-white transition-all duration-300 ease-in-out hover:opacity-90`;
    if (score <= 40) return `${colors.medium} text-white transition-all duration-300 ease-in-out hover:opacity-90`;
    if (score <= 60) return `${colors.high} text-white transition-all duration-300 ease-in-out hover:opacity-90`;
    if (score <= 80) return `${colors.very_high} text-white transition-all duration-300 ease-in-out hover:opacity-90`;
    return `${colors.extreme} text-white transition-all duration-300 ease-in-out hover:opacity-90`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (toxicityScore > 50) {
      setShowWarning(true);
    } else {
      onSubmit(e);
    }
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
        <AttachmentControls
          onAttachmentClick={onAttachmentClick}
          onCameraClick={onCameraClick}
          disabled={disabled}
          canAttach={canAttach}
        />

        <EnhanceButton
          onEnhance={handleEnhanceMessage}
          isEnhancing={isEnhancing}
          disabled={disabled}
          hasContent={!!message.trim()}
        />

        <MessageField
          message={message}
          onChange={onChange}
          disabled={disabled}
          isAnalyzing={isAnalyzing}
          inputRef={inputRef}
        />

        <SendButton
          hasMessage={!!message.trim()}
          buttonStyle={getButtonStyle()}
          onStartRecording={onStartRecording}
          disabled={disabled}
        />
      </form>

      <WarningDialog
        open={showWarning}
        onOpenChange={setShowWarning}
        onConfirm={() => {
          setShowWarning(false);
          onSubmit({ preventDefault: () => {} } as React.FormEvent);
        }}
        toxicityScore={toxicityScore}
      />
    </>
  );
}
