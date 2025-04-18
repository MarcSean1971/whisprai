
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProfileFormValues } from "@/components/profile-setup/types";

export function useProfile() {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileFormValues | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Ensure interests is always a string array
        const interests = Array.isArray(data.interests) 
          ? data.interests.map(i => String(i))
          : [];

        const formattedProfile: ProfileFormValues = {
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          tagline: data.tagline || '',
          birthdate: data.birthdate || '',
          bio: data.bio || '',
          language: data.language || '',
          interests: interests,
          avatarUrl: data.avatar_url || ''
        };
        setProfile(formattedProfile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (values: ProfileFormValues) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Ensure interests is always a string array
      const interests = Array.isArray(values.interests) 
        ? values.interests.map(String)
        : [];

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: values.firstName,
          last_name: values.lastName,
          tagline: values.tagline,
          birthdate: values.birthdate,
          bio: values.bio,
          language: values.language,
          interests: interests,
          avatar_url: values.avatarUrl,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      await fetchProfile(); // Refresh the profile data
      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      return false;
    }
  };

  return {
    profile,
    isLoading,
    updateProfile
  };
}
