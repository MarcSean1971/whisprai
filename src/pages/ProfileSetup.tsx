import React from 'react';
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

export default function ProfileSetup() {
  const navigate = useNavigate();
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

  const handleGoBack = () => {
    navigate('/home'); // Consistent with other navigation patterns
  };

  const onSubmit = form.handleSubmit((data) => {
    console.log('Form submitted:', data);
    // Here you would typically send the data to your backend
    navigate('/home');
  });

  return (
    <div className="container mx-auto px-4 py-6">
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
  );
}
