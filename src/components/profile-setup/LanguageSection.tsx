
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
import { useLanguages } from "@/hooks/use-languages";
import { Loader2 } from "lucide-react";

interface LanguageSectionProps {
  form: UseFormReturn<ProfileFormValues>;
}

export function LanguageSection({ form }: LanguageSectionProps) {
  const { languages, isLoading } = useLanguages();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading languages...</span>
      </div>
    );
  }

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
            <SelectContent 
              className="max-h-[300px] overflow-y-auto bg-popover z-50"
              position="popper"
              sideOffset={4}
              side="bottom"
            >
              {Object.entries(languages).map(([code, name]) => (
                <SelectItem key={code} value={code} className="cursor-pointer">
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
