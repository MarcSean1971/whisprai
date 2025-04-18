
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { ProfileFormValues } from "./types";

interface TaglineSectionProps {
  form: UseFormReturn<ProfileFormValues>;
}

export function TaglineSection({ form }: TaglineSectionProps) {
  return (
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
  );
}
