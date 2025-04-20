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
  const [deviceRegistered, setDeviceRegistered] = useState(false);
  
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
      toast.error('Failed to initialize call system');
      throw err;
    }
  };

  const fetchTwilioToken = async (userId: string): Promise<{ token: string, ttl: number }> => {
    console.log(`Fetching Twilio token for user: ${userId}`);
    
    const { data: tokenData, error: tokenError } = await supabase.functions.invoke('twilio-token', {
      body: { identity: userId }
    });

    if (tokenError || !tokenData?.token) {
      console.error('Failed to get Twilio token:', tokenError);
      throw new Error(tokenError?.message || 'Failed to get access token');
    }

    const expiryTimeMs = Date.now() + ((tokenData.ttl || 3600) * 1000);
    setTokenExpiryTime(expiryTimeMs);
    
    console.log(`Token received with TTL: ${tokenData.ttl}s, expires at: ${new Date(expiryTimeMs).toISOString()}`);
    
    return {
      token: tokenData.token,
      ttl: tokenData.ttl || 3600
    };
  };

  const initializeDevice = async (userId: string, retryCount = 0): Promise<Device> => {
    if (!userId) {
      throw new Error('Cannot initialize Twilio device without a user ID');
    }
    
    console.log(`Initializing Twilio device for user: ${userId} (attempt ${retryCount + 1})`);
    
    try {
      const { token } = await fetchTwilioToken(userId);
      console.log('Creating new Twilio device instance');
      
      const device = new Device();
      
      // Set up device ready event promise
      const deviceReadyPromise = new Promise<boolean>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Device initialization timed out'));
        }, 15000); // 15 second timeout
        
        device.on('ready', () => {
          clearTimeout(timeoutId);
          setDeviceRegistered(true);
          console.log('Device registered successfully');
          resolve(true);
        });
        
        device.on('error', (err) => {
          clearTimeout(timeoutId);
          console.error('Device error:', err);
          
          if (err.code === 31204) { // Token error
            setDeviceRegistered(false);
          }
          reject(err);
        });
      });
      
      console.log('Setting up device with token');
      device.setup(token, {
        debug: true,
        allowIncomingWhileBusy: true,
        codecPreferences: ['opus', 'pcmu'] as any[],
        warnings: true
      });

      // Wait for device to be ready
      await deviceReadyPromise;
      
      return device;
    } catch (err: any) {
      console.error(`Error in device setup (attempt ${retryCount + 1}):`, err);
      setDeviceRegistered(false);
      
      if (retryCount < 2) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`Retrying device setup in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return initializeDevice(userId, retryCount + 1);
      }
      
      toast.error('Could not initialize call system');
      throw err;
    }
  };

  const refreshToken = async (device: Device, userId: string): Promise<void> => {
    try {
      console.log('Refreshing Twilio token');
      const { token } = await fetchTwilioToken(userId);
      device.updateToken(token);
      setDeviceRegistered(true);
      console.log('Device token refreshed successfully');
    } catch (err) {
      console.error('Failed to refresh token:', err);
      setDeviceRegistered(false);
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

  return {
    initializeDevice,
    setupBrowserEnvironment,
    refreshToken,
    shouldRefreshToken,
    tokenExpiryTime,
    isDeviceRegistered: deviceRegistered
  };
}
