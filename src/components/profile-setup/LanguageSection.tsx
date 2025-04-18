
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { ProfileFormValues } from "./types";
import { languageNames } from "@/lib/languages";

interface LanguageSectionProps {
  form: UseFormReturn<ProfileFormValues>;
}

export function LanguageSection({ form }: LanguageSectionProps) {
  return (
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
            <SelectContent className="max-h-[200px]">
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
  );
}
