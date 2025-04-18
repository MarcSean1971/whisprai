
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { BasicInfo } from '@/components/profile-setup/BasicInfo';
import { ProfileDetails } from '@/components/profile-setup/ProfileDetails';
import { useForm } from 'react-hook-form';
import { ProfileFormValues } from '@/components/profile-setup/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSetupSchema } from './ProfileSetupSchema';
import { Form } from '@/components/ui/form';
import { BackButton } from '@/components/ui/back-button';
import { BottomNavigation } from '@/components/home/BottomNavigation';
import { useAdmin } from '@/hooks/use-admin';

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const [activeTab, setActiveTab] = useState<'chats' | 'contacts'>('chats');

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

  const handleEnhanceBio = (enhancedBio: string) => {
    form.setValue('bio', enhancedBio);
  };

  const handleLogout = async () => {
    // Implement logout logic similar to Home page
    navigate('/');
  };

  const onSubmit = form.handleSubmit((data) => {
    console.log('Form submitted:', data);
    navigate('/home');
  });

  return (
    <div className="flex flex-col h-screen bg-background w-full max-w-full">
      <div className="container mx-auto px-4 py-6 flex-1 overflow-y-auto">
        <header className="flex items-center justify-between mb-6">
          <BackButton />
          <h1 className="text-xl font-semibold">Profile Setup</h1>
          <div className="w-10"></div>
        </header>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-6">
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
        activeTab={activeTab}
        onLogout={handleLogout}
        isAdmin={isAdmin}
      />
    </div>
  );
}
