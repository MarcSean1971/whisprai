import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAvatarUpload } from '@/hooks/use-avatar-upload';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { AvatarUpload } from '@/components/profile-setup/AvatarUpload';
import { BasicInfo } from '@/components/profile-setup/BasicInfo';
import { ProfileDetails } from '@/components/profile-setup/ProfileDetails';
import { profileSchema, type ProfileFormValues } from '@/components/profile-setup/types';

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { uploadAvatar } = useAvatarUpload();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      tagline: '',
      birthdate: '',
      bio: '',
      language: '',
      interests: [],
    },
  });

  useEffect(() => {
    const checkSessionAndLoadProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/');
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;

        if (profile) {
          form.reset({
            firstName: profile.first_name || '',
            lastName: profile.last_name || '',
            tagline: profile.tagline || '',
            birthdate: profile.birthdate ? new Date(profile.birthdate).toISOString().split('T')[0] : '',
            bio: profile.bio || '',
            language: profile.language || '',
            interests: profile.interests as string[] || [],
          });
          setAvatarUrl(profile.avatar_url);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    checkSessionAndLoadProfile();
  }, [navigate, form]);

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
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No user found');

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: values.firstName,
          last_name: values.lastName,
          tagline: values.tagline,
          birthdate: values.birthdate,
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
      setIsSaving(false);
    }
  };

  const handleEnhanceBio = (enhancedBio: string) => {
    form.setValue('bio', enhancedBio);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 w-full max-w-full">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold">Complete Your Profile</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Tell us a little about yourself to get started
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <AvatarUpload 
              avatarUrl={avatarUrl} 
              onAvatarChange={handleAvatarChange}
            />
            <BasicInfo form={form} />
            <ProfileDetails 
              form={form}
              onEnhanceBio={handleEnhanceBio}
            />
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Profile'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
