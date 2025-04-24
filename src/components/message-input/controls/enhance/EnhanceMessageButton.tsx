
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EnhanceMessageButtonProps {
  message: string;
  onChange: (value: string) => void;
}

export async function enhanceMessage({ message, onChange }: EnhanceMessageButtonProps) {
  if (!message.trim()) {
    toast.error("Please enter a message to enhance");
    return;
  }

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
  }
}
