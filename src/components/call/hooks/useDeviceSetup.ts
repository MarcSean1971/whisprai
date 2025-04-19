
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
    if (!userId) {
      throw new Error('Cannot initialize Twilio device without a user ID');
    }
    
    console.log(`Initializing Twilio device for user: ${userId} (attempt ${retryCount + 1})`);
    
    try {
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke('twilio-token', {
        body: { identity: userId }
      });

      if (tokenError) {
        console.error('Failed to get Twilio token:', tokenError);
        throw new Error(tokenError.message || 'Failed to get access token');
      }

      if (!tokenData?.token) {
        console.error('No token received from server');
        throw new Error('No token received from server');
      }

      console.log('Creating new Twilio device instance');
      const device = new Device();
      
      console.log('Setting up device with token');
      await device.setup(tokenData.token, {
        debug: true,
        allowIncomingWhileBusy: true,
        codecPreferences: ['opus', 'pcmu'] as unknown as Codec[],
        // Fix for error #1: Change warnings from string[] to proper type
        warnings: true // Set to true to enable all warnings
      });

      // Wait briefly to ensure device is really ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!device.isInitialized) {
        throw new Error('Device failed to initialize properly');
      }

      // Fix for error #2: Use the correct method to get device state
      // The Device object uses device.status() not device.state()
      const connectionState = device.status();
      if (connectionState !== 'ready') {
        throw new Error(`Device in unexpected state: ${connectionState}`);
      }

      console.log('Device setup completed successfully');
      return device;
    } catch (err: any) {
      console.error(`Error in device setup (attempt ${retryCount + 1}):`, err);
      
      // Implement retry logic with exponential backoff
      if (retryCount < 2) { // Try up to 3 times total
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        console.log(`Retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return initializeDevice(userId, retryCount + 1);
      }
      
      toast.error('Could not initialize call system. Please try again later.');
      throw err;
    }
  };

  return {
    initializeDevice,
    setupBrowserEnvironment
  };
}
