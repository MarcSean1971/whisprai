
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
import { AvatarUpload } from "./AvatarUpload";
import { useAvatarUpload } from "@/hooks/use-avatar-upload";
import { BirthdateSection } from "./BirthdateSection";

interface BasicInfoProps {
  form: UseFormReturn<ProfileFormValues>;
}

export function BasicInfo({ form }: BasicInfoProps) {
  const { uploadAvatar } = useAvatarUpload();

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const avatarUrl = await uploadAvatar(file);
      if (avatarUrl) {
        form.setValue('avatarUrl', avatarUrl);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <FormField
          control={form.control}
          name="avatarUrl"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <AvatarUpload 
                  avatarUrl={field.value}
                  onAvatarChange={handleAvatarChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input placeholder="John" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input placeholder="Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <BirthdateSection form={form} />
    </div>
  );
}
