
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type BioEnhancerProps = {
  currentBio: string;
  onEnhance: (enhancedBio: string) => void;
};

export function BioEnhancer({ currentBio, onEnhance }: BioEnhancerProps) {
  const [isLoading, setIsLoading] = useState(false);

  const enhanceBio = async () => {
    if (!currentBio.trim()) {
      toast.error("Please enter some text in your bio first");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-bio', {
        body: { bio: currentBio }
      });

      if (error) throw error;
      if (!data?.enhancedBio) throw new Error('No enhanced bio received');

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
