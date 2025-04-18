
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { BasicInfo } from '@/components/profile-setup/BasicInfo';
import { ProfileDetails } from '@/components/profile-setup/ProfileDetails';
import { useForm } from 'react-hook-form';
import { ProfileFormValues } from '@/components/profile-setup/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSetupSchema } from './ProfileSetupSchema';

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
      interests: []
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
        <Button
          variant="ghost"
          size="icon"
          onClick={handleGoBack}
          className="md:hover:bg-accent"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">Profile Setup</h1>
        {/* Placeholder for potential additional header actions */}
        <div className="w-10"></div>
      </header>

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
    </div>
  );
}
