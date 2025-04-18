
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { ProfileFormValues } from "./types";
import { languageNames } from "@/lib/languages";
import { BioEnhancer } from "@/components/BioEnhancer";

interface ProfileDetailsProps {
  form: UseFormReturn<ProfileFormValues>;
  onEnhanceBio: (enhancedBio: string) => void;
}

export function ProfileDetails({ form, onEnhanceBio }: ProfileDetailsProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="tagline"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tagline</FormLabel>
            <FormControl>
              <Input placeholder="A short description about yourself" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="birthdate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Birthdate</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="language"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Preferred Language *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {Object.entries(languageNames).map(([code, name]) => (
                  <SelectItem key={code} value={code}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

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
                className="min-h-[100px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
