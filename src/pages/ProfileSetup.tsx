
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAvatarUpload } from '@/hooks/use-avatar-upload';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { languageNames } from '@/lib/languages';

const profileSchema = z.object({
  bio: z.string().optional(),
  language: z.string().min(1, 'Please select a language'),
  interests: z.array(z.string()).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { uploadAvatar } = useAvatarUpload();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      bio: '',
      language: '',
      interests: [],
    },
  });

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
      }
    };
    checkSession();
  }, [navigate]);

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    const url = await uploadAvatar(file);
    if (url) {
      setAvatarUrl(url);
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No user found');

      const { error } = await supabase
        .from('profiles')
        .update({
          bio: values.bio,
          language: values.language,
          interests: values.interests,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      navigate('/home');
    } catch (error) {
      toast.error('Error updating profile');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Complete Your Profile</h1>
          <p className="text-muted-foreground mt-2">
            Tell us a little about yourself to get started
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={avatarUrl || ''} alt="Profile" />
                <AvatarFallback>UP</AvatarFallback>
              </Avatar>
              <Input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="w-full max-w-xs"
              />
            </div>

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
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about yourself..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Profile'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
