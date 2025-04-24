
import React, { useState, useEffect } from "react";
import { AttachmentControls } from "./AttachmentControls";
import { EnhanceButton } from "./EnhanceButton";
import { MessageField } from "./MessageField";
import { SendButton } from "./SendButton";
import { WarningDialog } from "./WarningDialog";
import { useToxicityAnalysis } from "@/hooks/use-toxicity-analysis";
import { ToxicityIndicator } from "./toxicity/ToxicityIndicator";
import { enhanceMessage } from "./enhance/EnhanceMessageButton";

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
  const { toxicityScore, isAnalyzing, analyzeToxicity } = useToxicityAnalysis();
  const [lastToxicityScore, setLastToxicityScore] = useState(0);

  // Analyze toxicity when message changes
  useEffect(() => {
    if (message.trim()) {
      const timeoutId = setTimeout(() => {
        analyzeToxicity(message);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [message, analyzeToxicity]);

  // Update last toxicity score when current score changes
  useEffect(() => {
    if (toxicityScore > 0) {
      setLastToxicityScore(toxicityScore);
    }
  }, [toxicityScore]);

  const { buttonStyle } = ToxicityIndicator({
    toxicityScore,
    lastToxicityScore,
    isAnalyzing,
    hasMessage: !!message.trim()
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (toxicityScore > 50) {
      setShowWarning(true);
    } else {
      onSubmit(e);
    }
  };

  const handleEnhanceMessage = async () => {
    setIsEnhancing(true);
    await enhanceMessage({ message, onChange });
    setIsEnhancing(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex gap-1 w-full items-center">
        <div className="flex-shrink-0 flex gap-0.5">
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
        </div>

        <MessageField
          message={message}
          onChange={onChange}
          disabled={disabled}
          isAnalyzing={isAnalyzing}
          inputRef={inputRef}
        />

        <div className="flex-shrink-0">
          <SendButton
            hasMessage={!!message.trim()}
            buttonStyle={buttonStyle}
            onStartRecording={onStartRecording}
            disabled={disabled}
          />
        </div>
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
