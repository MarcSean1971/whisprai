
import { useState } from "react";
import { X, Smile } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EmojiPickerPopoverProps {
  onEmojiSelect: (emojiData: any) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  align?: "start" | "end";
  side?: "left" | "right";
}

export function EmojiPickerPopover({
  onEmojiSelect,
  isOpen,
  onOpenChange,
  align = "start",
  side = "right"
}: EmojiPickerPopoverProps) {
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start p-2 text-sm cursor-pointer"
          onClick={(e) => e.preventDefault()}
        >
          <Smile className="mr-2 h-4 w-4" />
          <span>Add Reaction</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-auto border-none shadow-lg"
        align={align}
        sideOffset={5}
        side={side}
      >
        <div className="bg-popover border rounded-md shadow-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Choose an emoji</span>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <EmojiPicker
            width={300}
            height={350}
            onEmojiClick={onEmojiSelect}
            lazyLoadEmojis={true}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
