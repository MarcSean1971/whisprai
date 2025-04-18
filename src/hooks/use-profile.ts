
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
        .select()
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const formattedProfile: ProfileFormValues = {
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          tagline: data.tagline || '',
          birthdate: data.birthdate || '',
          bio: data.bio || '',
          language: data.language || 'en',
          interests: Array.isArray(data.interests) ? data.interests.map(i => String(i)) : [],
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
    console.log('Starting profile update with values:', values);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Log the current user ID to help with debugging
      console.log('Current user ID:', user.id);

      const { error, data } = await supabase
        .from('profiles')
        .update({
          first_name: values.firstName,
          last_name: values.lastName,
          tagline: values.tagline,
          birthdate: values.birthdate,
          bio: values.bio,
          language: values.language,
          interests: Array.isArray(values.interests) ? values.interests : [],
          avatar_url: values.avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Profile update error:', error);
        throw error;
      }
      
      console.log('Profile updated successfully:', data);
      await fetchProfile(); // Refresh the profile data
      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    }
  };

  return {
    profile,
    isLoading,
    updateProfile
  };
}
