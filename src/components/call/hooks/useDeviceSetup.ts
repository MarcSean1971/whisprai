
import { Device } from 'twilio-client';
import { supabase } from '@/integrations/supabase/client';
import { initializeTwilioEnvironment } from '@/lib/twilio/browser-adapter';

// Import the Codec type from twilio-client if available, otherwise use any
type Codec = any;

export function useDeviceSetup() {
  const setupBrowserEnvironment = () => {
    try {
      initializeTwilioEnvironment();
      console.log('Browser environment initialized for Twilio');
    } catch (err) {
      console.error('Failed to initialize browser environment for Twilio:', err);
      throw err;
    }
  };

  const initializeDevice = async (userId: string): Promise<Device> => {
    const { data, error: tokenError } = await supabase.functions.invoke('twilio-token', {
      body: { identity: userId }
    });

    if (tokenError || !data?.token) {
      throw new Error(tokenError?.message || 'Failed to get access token');
    }

    const device = new Device();
    
    try {
      console.log('Setting up Twilio device with token');
      await device.setup(data.token, {
        debug: true,
        allowIncomingWhileBusy: true,
        codecPreferences: ['opus', 'pcmu'] as unknown as Codec[] // Type assertion to fix the TypeScript error
      });
      
      console.log('Twilio device setup successful');
      return device;
    } catch (err) {
      console.error('Error in device setup:', err);
      throw err;
    }
  };

  return {
    initializeDevice,
    setupBrowserEnvironment
  };
}
