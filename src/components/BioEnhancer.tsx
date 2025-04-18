
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

type BioEnhancerProps = {
  currentBio: string;
  onEnhance: (enhancedBio: string) => void;
};

export function BioEnhancer({ currentBio, onEnhance }: BioEnhancerProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Fetch OpenAI settings from Supabase
  const { data: aiSettings } = useQuery({
    queryKey: ['aiSettings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'openai_settings')
        .single();
      
      if (error) throw error;
      return data?.value;
    }
  });

  const enhanceBio = async () => {
    if (!currentBio.trim()) {
      toast.error("Please enter some text in your bio first");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/enhance-bio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bio: currentBio, settings: aiSettings }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to enhance bio');
      }

      const data = await response.json();
      onEnhance(data.enhancedBio);
      toast.success("Bio enhanced successfully!");
    } catch (error) {
      console.error('Error enhancing bio:', error);
      toast.error("Failed to enhance your bio. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={enhanceBio} 
      disabled={isLoading}
      className="h-8 w-8"
      title="Enhance your bio with AI"
    >
      <Sparkles className={`h-4 w-4 ${isLoading ? 'animate-pulse' : ''}`} />
    </Button>
  );
}
