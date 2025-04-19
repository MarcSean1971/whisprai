
import { Device } from 'twilio-client';
import { supabase } from '@/integrations/supabase/client';
import { initializeTwilioEnvironment } from '@/lib/twilio/browser-adapter';
import { toast } from 'sonner';

// Import the Codec type from twilio-client if available, otherwise use any
type Codec = any;

export function useDeviceSetup() {
  const setupBrowserEnvironment = () => {
    try {
      console.log('Setting up browser environment for Twilio');
      initializeTwilioEnvironment();
      
      // Verify that our polyfills are properly set up
      if (!window.util || typeof window.util.inherits !== 'function') {
        console.error('util.inherits polyfill not found');
        throw new Error('Browser environment setup failed: missing util.inherits');
      }
      
      if (!window.events || typeof window.events.EventEmitter !== 'function') {
        console.error('EventEmitter polyfill not found');
        throw new Error('Browser environment setup failed: missing EventEmitter');
      }
      
      console.log('Browser environment initialized successfully with all required polyfills');
    } catch (err) {
      console.error('Failed to initialize browser environment:', err);
      toast.error('Failed to initialize call system. Please refresh and try again.');
      throw err;
    }
  };

  const initializeDevice = async (userId: string, retryCount = 0): Promise<Device> => {
    console.log(`Initializing Twilio device for user: ${userId} (attempt ${retryCount + 1})`);
    
    try {
      const { data, error: tokenError } = await supabase.functions.invoke('twilio-token', {
        body: { identity: userId }
      });

      if (tokenError || !data?.token) {
        console.error('Failed to get Twilio token:', tokenError);
        throw new Error(tokenError?.message || 'Failed to get access token');
      }

      console.log('Creating new Twilio device instance');
      const device = new Device();
      
      console.log('Setting up device with token');
      await device.setup(data.token, {
        debug: true,
        allowIncomingWhileBusy: true,
        codecPreferences: ['opus', 'pcmu'] as unknown as Codec[]
      });

      console.log('Device setup completed successfully');
      return device;
    } catch (err) {
      console.error(`Error in device setup (attempt ${retryCount + 1}):`, err);
      
      // Implement retry logic with exponential backoff
      if (retryCount < 2) { // Try up to 3 times
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        console.log(`Retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return initializeDevice(userId, retryCount + 1);
      }
      
      toast.error('Failed to initialize call system. Please try again later.');
      throw err;
    }
  };

  return {
    initializeDevice,
    setupBrowserEnvironment
  };
}
