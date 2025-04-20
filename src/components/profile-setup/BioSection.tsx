
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { ProfileFormValues } from "./types";
import { BioEnhancer } from "@/components/BioEnhancer";

interface BioSectionProps {
  form: UseFormReturn<ProfileFormValues>;
  onEnhanceBio: (enhancedBio: string) => void;
}

export function BioSection({ form, onEnhanceBio }: BioSectionProps) {
  return (
    <FormField
      control={form.control}
      name="bio"
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center justify-between">
            <FormLabel>Bio</FormLabel>
            <BioEnhancer 
              currentBio={field.value || ''} 
              onEnhance={onEnhanceBio}
            />
          </div>
          <FormControl>
            <Textarea
              placeholder="Tell us about yourself..."
              className="min-h-[100px] max-h-[200px] no-scrollbar pr-10"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
