
import { Device } from 'twilio-client';
import { supabase } from '@/integrations/supabase/client';
import { initializeTwilioEnvironment } from '@/lib/twilio/browser-adapter';
import { toast } from 'sonner';
import { useState, useCallback } from 'react';

// Import the Codec type from twilio-client if available, otherwise use any
type Codec = any;

// Token expiration buffer (5 minutes before actual expiry)
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

export function useDeviceSetup() {
  const [tokenExpiryTime, setTokenExpiryTime] = useState<number | null>(null);
  
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

  const fetchTwilioToken = async (userId: string): Promise<{ token: string, ttl: number }> => {
    console.log(`Fetching Twilio token for user: ${userId}`);
    
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

    // Calculate token expiry time based on TTL
    const expiryTimeMs = Date.now() + ((tokenData.ttl || 3600) * 1000);
    setTokenExpiryTime(expiryTimeMs);
    
    console.log(`Token received with TTL: ${tokenData.ttl}s, expires at: ${new Date(expiryTimeMs).toISOString()}`);
    
    return {
      token: tokenData.token,
      ttl: tokenData.ttl || 3600
    };
  };
  
  const refreshToken = async (device: Device, userId: string): Promise<void> => {
    try {
      console.log('Refreshing Twilio token');
      const { token } = await fetchTwilioToken(userId);
      
      // Update the device with the new token
      device.updateToken(token);
      console.log('Device token refreshed successfully');
    } catch (err) {
      console.error('Failed to refresh token:', err);
      throw err;
    }
  };

  const shouldRefreshToken = (): boolean => {
    if (!tokenExpiryTime) return false;
    
    // Refresh if we're within the buffer period before expiration
    const shouldRefresh = Date.now() > (tokenExpiryTime - TOKEN_REFRESH_BUFFER_MS);
    if (shouldRefresh) {
      console.log('Token needs refreshing');
    }
    
    return shouldRefresh;
  };

  const initializeDevice = async (userId: string, retryCount = 0): Promise<Device> => {
    if (!userId) {
      throw new Error('Cannot initialize Twilio device without a user ID');
    }
    
    console.log(`Initializing Twilio device for user: ${userId} (attempt ${retryCount + 1})`);
    
    try {
      // Fetch the initial token
      const { token } = await fetchTwilioToken(userId);

      console.log('Creating new Twilio device instance');
      const device = new Device();
      
      // Set up device ready event promise to properly wait for initialization
      const deviceReadyPromise = new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Device initialization timed out'));
        }, 10000); // 10 second timeout
        
        device.on('ready', () => {
          clearTimeout(timeoutId);
          resolve(true);
        });
        
        device.on('error', (err) => {
          clearTimeout(timeoutId);
          
          // Only reject for non-token errors, as we'll handle token errors separately
          if (err.code !== 31204) {
            reject(err);
          } else {
            console.error('Token error during setup:', err);
            // Still resolve but log the error, we'll handle token refresh later
            resolve(false);
          }
        });
      });
      
      console.log('Setting up device with token');
      device.setup(token, {
        debug: true,
        allowIncomingWhileBusy: true,
        codecPreferences: ['opus', 'pcmu'] as unknown as Codec[],
        warnings: true
      });

      // Wait for device to be ready
      await deviceReadyPromise;
      
      // Add error listener for token errors that occur after initialization
      device.on('error', (err) => {
        // Check if this is a JWT error
        if (err.code === 31204 || (err.twilioError && err.twilioError.code === 20101)) {
          console.error('JWT validation error detected, will attempt refresh');
          // Don't refresh here, let the hook handle it
        }
      });
      
      // Double check connection state
      const connectionState = device.status();
      if (connectionState !== 'ready') {
        console.warn(`Device in unexpected state: ${connectionState}, but continuing`);
        // We'll try to recover rather than throwing an error
      }

      console.log('Device setup completed successfully');
      return device;
    } catch (err: any) {
      console.error(`Error in device setup (attempt ${retryCount + 1}):`, err);
      
      if (err.message?.includes('Failed to send a request to the Edge Function')) {
        console.error('Edge function error - please check if the function is deployed and running');
      }
      
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
    setupBrowserEnvironment,
    refreshToken,
    shouldRefreshToken,
    tokenExpiryTime
  };
}
