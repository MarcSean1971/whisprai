
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

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const { profile, isLoading, updateProfile } = useProfile();

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
    if (profile && !isLoading) {
      Object.entries(profile).forEach(([key, value]) => {
        if (value !== null) {
          form.setValue(key as keyof ProfileFormValues, value);
        }
      });
    }
  }, [profile, isLoading, form]);

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
    const success = await updateProfile(data);
    if (success) {
      navigate('/home');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background w-full max-w-full">
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b">
        <Logo variant="full" />
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-6 flex-1 overflow-y-auto">
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
            <div className="flex justify-end">
              <Button type="submit">
                Save Profile
              </Button>
            </div>
          </form>
        </Form>
      </div>
      
      <BottomNavigation 
        onLogout={handleLogout}
        isAdmin={isAdmin}
      />
    </div>
  );
}
