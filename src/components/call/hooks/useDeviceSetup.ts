
import { useState, useCallback, useRef } from 'react';
import { Device } from 'twilio-client';
import { supabase } from '@/integrations/supabase/client';
import { initializeTwilioEnvironment } from '@/lib/twilio/browser-adapter';
import { toast } from 'sonner';

// Minimum wait time between token requests (5 seconds)
const MIN_TOKEN_REQUEST_INTERVAL = 5000;
// Token refresh buffer (5 minutes before expiry)
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const DEVICE_INIT_TIMEOUT = 15000; // 15 seconds
const TOKEN_ERROR_COOLDOWN_MS = 10000; // 10 second cooldown after token errors

export function useDeviceSetup() {
  const [tokenExpiryTime, setTokenExpiryTime] = useState<number | null>(null);
  const [deviceRegistered, setDeviceRegistered] = useState(false);
  const tokenRequestInProgress = useRef(false);
  const lastTokenRequest = useRef<number>(0);
  const deviceInitTimeout = useRef<number | null>(null);
  const recoveryTimerRef = useRef<number | null>(null);

  const fetchTwilioToken = async (userId: string): Promise<{ 
    token: string, 
    ttl: number,
    expiresAt: string 
  }> => {
    // Prevent rapid token requests
    const now = Date.now();
    if (now - lastTokenRequest.current < MIN_TOKEN_REQUEST_INTERVAL) {
      console.log('Token request too soon, waiting...');
      await new Promise(resolve => setTimeout(resolve, MIN_TOKEN_REQUEST_INTERVAL));
    }

    if (tokenRequestInProgress.current) {
      console.log('Token request in progress, waiting...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchTwilioToken(userId);
    }

    console.log('Fetching new Twilio token...');
    tokenRequestInProgress.current = true;
    lastTokenRequest.current = now;

    try {
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke('twilio-token', {
        body: { 
          identity: userId,
          ttl: 1800 // 30 minutes
        }
      });

      if (tokenError || !tokenData?.token) {
        throw new Error(tokenError?.message || 'Failed to get access token');
      }

      console.log('Token received, expires:', tokenData.expiresAt);
      setTokenExpiryTime(new Date(tokenData.expiresAt).getTime());

      return {
        token: tokenData.token,
        ttl: tokenData.ttl,
        expiresAt: tokenData.expiresAt
      };
    } finally {
      tokenRequestInProgress.current = false;
    }
  };

  const setupBrowserEnvironment = useCallback(() => {
    try {
      console.log('Setting up browser environment for Twilio');
      initializeTwilioEnvironment();
      
      // Verify polyfills are properly set up
      if (!window.util || typeof window.util.inherits !== 'function') {
        throw new Error('Browser environment setup failed: missing util.inherits');
      }
      
      if (!window.events || typeof window.events.EventEmitter !== 'function') {
        throw new Error('Browser environment setup failed: missing EventEmitter');
      }
      
      console.log('Browser environment initialized successfully');
    } catch (err) {
      console.error('Failed to initialize browser environment:', err);
      throw err;
    }
  }, []);

  const initializeDevice = async (userId: string): Promise<Device> => {
    if (!userId) {
      throw new Error('Cannot initialize Twilio device without a user ID');
    }

    console.log('Initializing new Twilio device');
    
    try {
      const { token } = await fetchTwilioToken(userId);
      
      // Clean up any existing device
      try {
        const global = window as any;
        if (global.twilioDevice) {
          console.log('Cleaning up existing device');
          global.twilioDevice.destroy();
          global.twilioDevice = null;
        }
      } catch (e) {
        console.warn('Error cleaning up existing device:', e);
      }

      const device = new Device();
      
      // Set up device ready promise with timeout
      const deviceReady = new Promise<Device>((resolve, reject) => {
        deviceInitTimeout.current = window.setTimeout(() => {
          device.destroy();
          reject(new Error('Device initialization timed out'));
        }, DEVICE_INIT_TIMEOUT);

        device.on('ready', () => {
          if (deviceInitTimeout.current) {
            clearTimeout(deviceInitTimeout.current);
          }
          setDeviceRegistered(true);
          console.log('Device registered successfully');
          resolve(device);
        });

        device.on('error', (err) => {
          if (deviceInitTimeout.current) {
            clearTimeout(deviceInitTimeout.current);
          }
          console.error('Device error:', err);
          reject(err);
        });
      });

      // Store reference to device globally for debugging
      (window as any).twilioDevice = device;
      
      console.log('Setting up device with token');
      device.setup(token, {
        debug: true,
        allowIncomingWhileBusy: true,
        codecPreferences: ['opus', 'pcmu'],
        warnings: true
      });

      return await deviceReady;
    } catch (err) {
      console.error('Failed to initialize device:', err);
      throw err;
    }
  };

  const refreshToken = async (device: Device, userId: string): Promise<void> => {
    if (!device || !userId) {
      console.warn('Cannot refresh token: invalid device or user ID');
      return;
    }

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

  const shouldRefreshToken = useCallback((): boolean => {
    if (!tokenExpiryTime) return false;
    
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
