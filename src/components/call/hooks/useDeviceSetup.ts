
import { useState, useCallback, useRef } from 'react';
import { Device } from 'twilio-client';
import { supabase } from '@/integrations/supabase/client';
import { initializeTwilioEnvironment } from '@/lib/twilio/browser-adapter';
import { toast } from 'sonner';

// Configuration constants
const TOKEN_VALIDATION_TIMEOUT = 10000; // 10 seconds timeout for token validation
const MIN_TOKEN_REQUEST_INTERVAL = 5000; // Minimum wait time between token requests
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // Refresh token 5 minutes before expiry

export function useDeviceSetup() {
  const [tokenExpiryTime, setTokenExpiryTime] = useState<number | null>(null);
  const [deviceRegistered, setDeviceRegistered] = useState(false);
  const tokenRequestInProgress = useRef(false);
  const lastTokenRequest = useRef<number>(0);
  const currentToken = useRef<string | null>(null);
  const validationTimer = useRef<number | null>(null);

  // Helper function to safely clean up temporary validation device
  const cleanupTempDevice = useCallback((device: Device) => {
    try {
      device.destroy();
    } catch (e) {
      console.warn('Error cleaning up temporary validation device:', e);
    }
  }, []);

  const validateToken = useCallback(async (token: string): Promise<boolean> => {
    if (!token) {
      console.warn('Cannot validate null or empty token');
      return false;
    }

    // Basic JWT format check
    const jwtParts = token.split('.');
    if (jwtParts.length !== 3) {
      console.warn('Token failed basic format validation');
      return false;
    }

    try {
      // Try to decode and validate the payload
      const payload = JSON.parse(atob(jwtParts[1]));
      if (!payload.iss || !payload.exp || !payload.grants) {
        console.warn('Token payload missing required fields');
        return false;
      }

      // Create a temporary device just to validate the token
      const tempDevice = new Device();
      
      const validationPromise = new Promise<boolean>((resolve) => {
        validationTimer.current = window.setTimeout(() => {
          console.warn('Token validation timed out');
          resolve(false);
          cleanupTempDevice(tempDevice);
        }, TOKEN_VALIDATION_TIMEOUT);
        
        tempDevice.on('ready', () => {
          if (validationTimer.current) {
            clearTimeout(validationTimer.current);
            validationTimer.current = null;
          }
          resolve(true);
          cleanupTempDevice(tempDevice);
        });
        
        tempDevice.on('error', (error) => {
          console.warn('Token validation error:', error);
          if (validationTimer.current) {
            clearTimeout(validationTimer.current);
            validationTimer.current = null;
          }
          resolve(false);
          cleanupTempDevice(tempDevice);
        });
      });
      
      tempDevice.setup(token, { debug: true });
      return await validationPromise;

    } catch (err) {
      console.error('Error during token validation:', err);
      return false;
    } finally {
      if (validationTimer.current) {
        clearTimeout(validationTimer.current);
        validationTimer.current = null;
      }
    }
  }, [cleanupTempDevice]);

  const fetchTwilioToken = useCallback(async (userId: string): Promise<{ 
    token: string, 
    ttl: number,
    expiresAt: string 
  }> => {
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
        console.error('Error fetching token from server:', tokenError);
        throw new Error(tokenError?.message || 'Failed to get access token');
      }

      console.log('Token received, expires:', tokenData.expiresAt);
      
      const isValid = await validateToken(tokenData.token);
      if (!isValid) {
        console.error('Received invalid token from server');
        throw new Error('Invalid token received');
      }

      setTokenExpiryTime(new Date(tokenData.expiresAt).getTime());
      currentToken.current = tokenData.token;

      return tokenData;
    } catch (error) {
      console.error('Error fetching Twilio token:', error);
      currentToken.current = null;
      throw error;
    } finally {
      tokenRequestInProgress.current = false;
    }
  }, [validateToken]);

  const setupBrowserEnvironment = useCallback(() => {
    try {
      console.log('Setting up browser environment for Twilio');
      initializeTwilioEnvironment();
      
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

  const initializeDevice = useCallback(async (userId: string): Promise<Device> => {
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
      
      const deviceReady = new Promise<Device>((resolve, reject) => {
        const timeout = window.setTimeout(() => {
          try {
            device.destroy();
          } catch (e) {
            console.warn('Error destroying device during timeout cleanup:', e);
          }
          reject(new Error('Device initialization timed out'));
        }, 15000);

        device.on('ready', () => {
          clearTimeout(timeout);
          setDeviceRegistered(true);
          console.log('Device registered successfully');
          resolve(device);
        });

        device.on('error', (err) => {
          clearTimeout(timeout);
          console.error('Device error:', err);
          setDeviceRegistered(false);
          reject(err);
        });
      });

      device.setup(token, {
        debug: true,
        warnings: true,
        allowIncomingWhileBusy: true
      });

      (window as any).twilioDevice = device;
      return await deviceReady;

    } catch (err) {
      console.error('Failed to initialize device:', err);
      throw err;
    }
  }, [fetchTwilioToken]);

  const refreshToken = useCallback(async (device: Device, userId: string): Promise<void> => {
    if (!device || !userId) {
      console.warn('Cannot refresh token: invalid device or user ID');
      return;
    }

    try {
      console.log('Refreshing Twilio token');
      const { token } = await fetchTwilioToken(userId);
      
      if (device && typeof device.updateToken === 'function') {
        device.updateToken(token);
        setDeviceRegistered(true);
        console.log('Device token refreshed successfully');
      } else {
        console.warn('Device no longer valid during token refresh');
        throw new Error('Device is no longer valid');
      }
    } catch (err) {
      console.error('Failed to refresh token:', err);
      setDeviceRegistered(false);
      throw err;
    }
  }, [fetchTwilioToken]);

  const shouldRefreshToken = useCallback((): boolean => {
    if (!tokenExpiryTime) return false;
    return Date.now() > (tokenExpiryTime - TOKEN_REFRESH_BUFFER_MS);
  }, [tokenExpiryTime]);

  return {
    setupBrowserEnvironment,
    initializeDevice,
    refreshToken,
    shouldRefreshToken,
    tokenExpiryTime,
    isDeviceRegistered: deviceRegistered,
    validateToken,
    currentToken
  };
}
