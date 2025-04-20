
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
const TOKEN_VALIDATION_TIMEOUT = 10000; // 10 seconds timeout for token validation

export function useDeviceSetup() {
  const [tokenExpiryTime, setTokenExpiryTime] = useState<number | null>(null);
  const [deviceRegistered, setDeviceRegistered] = useState(false);
  const tokenRequestInProgress = useRef(false);
  const lastTokenRequest = useRef<number>(0);
  const deviceInitTimeout = useRef<number | null>(null);
  const recoveryTimerRef = useRef<number | null>(null);
  const tokenValidationTimer = useRef<number | null>(null);
  const currentToken = useRef<string | null>(null);

  // Lightweight token validation - just check basic JWT structure
  const isTokenFormatValid = (token: string): boolean => {
    if (!token) {
      console.warn('Token is empty or null');
      return false;
    }
    
    // Basic JWT format check (header.payload.signature)
    const jwtParts = token.split('.');
    if (jwtParts.length !== 3) {
      console.warn('Token has invalid JWT format, expected 3 parts but got:', jwtParts.length);
      return false;
    }
    
    try {
      // Try to decode the payload
      const payload = atob(jwtParts[1]);
      if (!payload || payload.length < 5) {
        console.warn('Token payload is too short or invalid');
        return false;
      }
      
      // Try to parse the payload as JSON to verify it's properly formatted
      try {
        JSON.parse(payload);
      } catch (e) {
        console.warn('Token payload is not valid JSON');
        return false;
      }
      
      return true;
    } catch (e) {
      console.warn('Token payload is not valid base64:', e);
      return false;
    }
  };

  const validateToken = async (token: string): Promise<boolean> => {
    if (!token) {
      console.warn('Cannot validate null or empty token');
      return false;
    }
    
    // First do a simple format check
    if (!isTokenFormatValid(token)) {
      console.warn('Token failed basic format validation');
      return false;
    }
    
    try {
      console.log('Starting token validation');
      // Create a temporary device just to validate the token
      const tempDevice = new Device();
      
      // Set up promise to track validation
      const validationPromise = new Promise<boolean>((resolve) => {
        // Set timeout to handle case where token is invalid but error isn't thrown
        tokenValidationTimer.current = window.setTimeout(() => {
          console.warn('Token validation timed out');
          resolve(false);
          cleanupTempDevice(tempDevice);
        }, TOKEN_VALIDATION_TIMEOUT);
        
        // Listen for ready event which indicates token is valid
        tempDevice.on('ready', () => {
          console.log('Token validation successful - device ready');
          if (tokenValidationTimer.current) {
            clearTimeout(tokenValidationTimer.current);
            tokenValidationTimer.current = null;
          }
          resolve(true);
          cleanupTempDevice(tempDevice);
        });
        
        // Listen for error event which may indicate token is invalid
        tempDevice.on('error', (err) => {
          if (tokenValidationTimer.current) {
            clearTimeout(tokenValidationTimer.current);
            tokenValidationTimer.current = null;
          }
          
          // Check if error is related to JWT
          const isJwtError = err.message?.includes('JWT') || 
                           err.message?.includes('token') ||
                           err.message?.includes('Invalid') ||
                           err.code === 31204 || 
                           err.code === 31205;
          
          console.warn(`Token validation error (JWT error: ${isJwtError}):`, err);
          resolve(false);
          cleanupTempDevice(tempDevice);
        });
      });
      
      // Setup the device with the token to test
      tempDevice.setup(token, { debug: true });
      
      // Wait for validation result
      return await validationPromise;
    } catch (err) {
      console.error('Error during token validation:', err);
      return false;
    } finally {
      if (tokenValidationTimer.current) {
        clearTimeout(tokenValidationTimer.current);
        tokenValidationTimer.current = null;
      }
    }
  };
  
  // Helper function to safely clean up temporary validation device
  const cleanupTempDevice = (device: Device) => {
    try {
      device.destroy();
    } catch (e) {
      console.warn('Error cleaning up temporary validation device:', e);
    }
  };

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
        console.error('Error fetching token from server:', tokenError);
        throw new Error(tokenError?.message || 'Failed to get access token');
      }

      console.log('Token received, expires:', tokenData.expiresAt);
      
      // Immediately validate the token format before deeper validation
      if (!isTokenFormatValid(tokenData.token)) {
        console.error('Received malformed token from server');
        throw new Error('Invalid Twilio token format');
      }
      
      // Full validation using a temporary device
      const isValid = await validateToken(tokenData.token);
      
      if (!isValid) {
        console.error('Received invalid token from server');
        throw new Error('Invalid Twilio token received');
      }
      
      setTokenExpiryTime(new Date(tokenData.expiresAt).getTime());
      currentToken.current = tokenData.token;

      return {
        token: tokenData.token,
        ttl: tokenData.ttl,
        expiresAt: tokenData.expiresAt
      };
    } catch (error) {
      console.error('Error fetching Twilio token:', error);
      currentToken.current = null;
      throw error;
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
          try {
            device.destroy();
          } catch (e) {
            console.warn('Error destroying device during timeout cleanup:', e);
          }
          reject(new Error('Device initialization timed out'));
        }, DEVICE_INIT_TIMEOUT);

        device.on('ready', () => {
          if (deviceInitTimeout.current) {
            clearTimeout(deviceInitTimeout.current);
            deviceInitTimeout.current = null;
          }
          setDeviceRegistered(true);
          console.log('Device registered successfully');
          resolve(device);
        });

        device.on('error', (err) => {
          if (deviceInitTimeout.current) {
            clearTimeout(deviceInitTimeout.current);
            deviceInitTimeout.current = null;
          }
          console.error('Device error:', err);
          
          // Check if error is related to JWT
          if (err.message?.includes('JWT') || 
              err.message?.includes('token') ||
              err.code === 31204 || 
              err.code === 31205) {
            // Invalidate current token
            currentToken.current = null;
          }
          
          reject(err);
        });
      });

      // Store reference to device globally for debugging
      (window as any).twilioDevice = device;
      
      console.log('Setting up device with token');
      device.setup(token, {
        debug: true,
        allowIncomingWhileBusy: true,
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
      
      // Only update if device is still valid
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
    isDeviceRegistered: deviceRegistered,
    validateToken,
    currentToken
  };
}
