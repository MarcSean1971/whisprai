
import { Device } from 'twilio-client';
import { supabase } from '@/integrations/supabase/client';
import { setupPolyfills } from '@/lib/polyfills/setup';

export function useDeviceSetup() {
  const initializeDevice = async (userId: string): Promise<Device> => {
    const { data, error: tokenError } = await supabase.functions.invoke('twilio-token', {
      body: { identity: userId }
    });

    if (tokenError || !data?.token) {
      throw new Error(tokenError?.message || 'Failed to get access token');
    }

    const device = new Device();
    
    try {
      await device.setup(data.token, {
        debug: true,
        allowIncomingWhileBusy: true,
        codecPreferences: ['opus', 'pcmu'] as any
      });
      
      return device;
    } catch (err) {
      console.error('Error in device setup:', err);
      throw err;
    }
  };

  return {
    setupPolyfills,
    initializeDevice
  };
}
