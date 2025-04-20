import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { BasicInfo } from '@/components/profile-setup/BasicInfo';
import { ProfileDetails } from '@/components/profile-setup/ProfileDetails';
import { useForm } from 'react-hook-form';
import { ProfileFormValues } from '@/components/profile-setup/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSetupSchema } from './ProfileSetupSchema';
import { Form } from '@/components/ui/form';
import { BottomNavigation } from '@/components/home/BottomNavigation';
import { useAdmin } from '@/hooks/use-admin';
import { Logo } from "@/components/Logo";
import { useProfile } from '@/hooks/use-profile';
import { supabase } from '@/integrations/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';
import { toast } from 'sonner';
import { Loader2, LogOut } from 'lucide-react';

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const { profile, isLoading: profileLoading, updateProfile } = useProfile();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      tagline: '',
      birthdate: '',
      bio: '',
      language: '',
      interests: [],
      avatarUrl: ''
    }
  });

  useEffect(() => {
    if (profile && !profileLoading) {
      Object.entries(profile).forEach(([key, value]) => {
        if (value !== null) {
          form.setValue(key as keyof ProfileFormValues, value);
        }
      });
    }
  }, [profile, profileLoading, form]);

  const handleEnhanceBio = (enhancedBio: string) => {
    form.setValue('bio', enhancedBio);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/");
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    console.log('Form submission started:', data);
    setIsSubmitting(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      console.log('Current auth user:', authData.user);
      
      const success = await updateProfile(data);
      console.log('Profile update result:', success);

      if (success) {
        toast.success('Profile updated successfully');
        setTimeout(() => {
          navigate('/home');
        }, 1000);
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background w-full max-w-full">
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b">
        <Logo variant="full" />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLogout}
            className="text-destructive hover:text-destructive/90"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 flex-1 overflow-y-auto pb-24">
        <header className="flex items-center justify-center mb-6">
          <h1 className="text-xl font-semibold">Profile Setup</h1>
        </header>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <BasicInfo form={form} />
            <ProfileDetails 
              form={form} 
              onEnhanceBio={handleEnhanceBio} 
            />
            <div className="sticky bottom-0 left-0 right-0 bg-background border-t">
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : 'Save Profile'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
      
      <BottomNavigation 
        isAdmin={isAdmin}
      />
    </div>
  );
}
