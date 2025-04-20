
import { useState, useCallback, useRef } from 'react';
import { Device } from 'twilio-client';
import { supabase } from '@/integrations/supabase/client';
import { initializeTwilioEnvironment } from '@/lib/twilio/browser-adapter';
import { toast } from 'sonner';

// Token expiration buffer (5 minutes before actual expiry)
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const DEVICE_INIT_TIMEOUT = 15000; // 15 seconds
const MAX_TOKEN_RETRIES = 3;
const TOKEN_ERROR_COOLDOWN_MS = 10000; // Cooldown to prevent spamming token requests

interface UseDeviceSetupResult {
  setupBrowserEnvironment: () => void;
  initializeDevice: (userId: string) => Promise<Device>;
  refreshToken: (device: Device, userId: string) => Promise<void>;
  shouldRefreshToken: () => boolean;
  tokenExpiryTime: number | null;
  isDeviceRegistered: boolean;
}

export function useDeviceSetup(): UseDeviceSetupResult {
  const [tokenExpiryTime, setTokenExpiryTime] = useState<number | null>(null);
  const [deviceRegistered, setDeviceRegistered] = useState(false);
  const tokenRequestInProgress = useRef(false);
  const lastTokenError = useRef<number>(0);
  
  const setupBrowserEnvironment = () => {
    try {
      console.log('Setting up browser environment for Twilio');
      initializeTwilioEnvironment();
      
      // Verify that our polyfills are properly set up
      if (!window.util || typeof window.util.inherits !== 'function') {
        throw new Error('Browser environment setup failed: missing util.inherits');
      }
      
      if (!window.events || typeof window.events.EventEmitter !== 'function') {
        throw new Error('Browser environment setup failed: missing EventEmitter');
      }
      
      console.log('Browser environment initialized successfully with all required polyfills');
    } catch (err) {
      console.error('Failed to initialize browser environment:', err);
      throw err;
    }
  };

  const fetchTwilioToken = async (userId: string, retryCount = 0): Promise<{ token: string, ttl: number }> => {
    if (tokenRequestInProgress.current) {
      console.log('Token request already in progress, waiting...');
      // Wait for the existing request to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      return fetchTwilioToken(userId, retryCount);
    }

    // Check for token request cooldown
    const now = Date.now();
    if (now - lastTokenError.current < TOKEN_ERROR_COOLDOWN_MS && retryCount > 0) {
      console.log(`Token request in cooldown period, waiting ${Math.ceil((TOKEN_ERROR_COOLDOWN_MS - (now - lastTokenError.current)) / 1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, TOKEN_ERROR_COOLDOWN_MS - (now - lastTokenError.current)));
    }

    console.log(`Fetching Twilio token for user: ${userId} (attempt ${retryCount + 1}/${MAX_TOKEN_RETRIES})`);
    
    tokenRequestInProgress.current = true;
    
    try {
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke('twilio-token', {
        body: { identity: userId }
      });

      tokenRequestInProgress.current = false;

      if (tokenError || !tokenData?.token) {
        lastTokenError.current = Date.now();
        throw new Error(tokenError?.message || 'Failed to get access token');
      }

      const expiryTimeMs = Date.now() + ((tokenData.ttl || 3600) * 1000);
      setTokenExpiryTime(expiryTimeMs);
      
      console.log(`Token received with TTL: ${tokenData.ttl}s, expires at: ${new Date(expiryTimeMs).toISOString()}`);
      
      return {
        token: tokenData.token,
        ttl: tokenData.ttl || 3600
      };
    } catch (err) {
      tokenRequestInProgress.current = false;
      console.error('Error fetching token:', err);
      
      if (retryCount < MAX_TOKEN_RETRIES - 1) {
        console.log(`Token fetch failed, retrying in ${(retryCount + 1) * 1000}ms...`);
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000));
        return fetchTwilioToken(userId, retryCount + 1);
      }
      throw err;
    }
  };

  const initializeDevice = async (userId: string, retryCount = 0): Promise<Device> => {
    if (!userId) {
      throw new Error('Cannot initialize Twilio device without a user ID');
    }
    
    console.log(`Initializing Twilio device for user: ${userId} (attempt ${retryCount + 1})`);
    
    try {
      const { token } = await fetchTwilioToken(userId);
      console.log('Creating new Twilio device instance');
      
      // Clean up any existing device before creating a new one
      try {
        const global = window as any;
        if (global.twilioDevice) {
          console.log('Destroying existing device before creating a new one');
          global.twilioDevice.destroy();
          global.twilioDevice = null;
        }
      } catch (e) {
        console.warn('Error cleaning up existing device:', e);
      }
      
      const device = new Device();
      
      // Store reference to device globally for debugging
      (window as any).twilioDevice = device;
      
      // Set up device ready event promise with timeout
      const deviceReadyPromise = new Promise<boolean>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          device.destroy();
          reject(new Error('Device initialization timed out'));
        }, DEVICE_INIT_TIMEOUT);
        
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
            lastTokenError.current = Date.now();
          }
          reject(err);
        });

        // Listen for offline events
        device.on('offline', () => {
          console.log('Device went offline');
          setDeviceRegistered(false);
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
      
      throw err;
    }
  };

  const refreshToken = async (device: Device, userId: string): Promise<void> => {
    try {
      console.log('Refreshing Twilio token');
      const { token } = await fetchTwilioToken(userId);
      
      // Verify device exists and is not destroyed
      if (device && typeof device.updateToken === 'function') {
        device.updateToken(token);
        setDeviceRegistered(true);
        console.log('Device token refreshed successfully');
      } else {
        throw new Error('Invalid device state during token refresh');
      }
    } catch (err) {
      console.error('Failed to refresh token:', err);
      setDeviceRegistered(false);
      throw err;
    }
  };

  const shouldRefreshToken = useCallback((): boolean => {
    if (!tokenExpiryTime) return false;
    
    // Refresh if we're within the buffer period before expiration
    const shouldRefresh = Date.now() > (tokenExpiryTime - TOKEN_REFRESH_BUFFER_MS);
    if (shouldRefresh) {
      console.log('Token needs refreshing');
    }
    
    return shouldRefresh;
  }, [tokenExpiryTime]);

  return {
    setupBrowserEnvironment,
    initializeDevice,
    refreshToken,
    shouldRefreshToken,
    tokenExpiryTime,
    isDeviceRegistered: deviceRegistered
  };
}
