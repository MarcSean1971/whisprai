
import { useEffect, useRef, useState, useCallback } from 'react';
import { useDeviceSetup } from './useDeviceSetup';
import { useDeviceState } from './useDeviceState';
import { useCallActions } from './useCallActions';
import { useCallInitialization } from './useCallInitialization';
import { UseTwilioVoiceProps, CallStatus } from '../types';
import { toast } from 'sonner';

// Token refresh interval (every 3 minutes)
const TOKEN_REFRESH_INTERVAL_MS = 3 * 60 * 1000;
const MAX_INIT_ATTEMPTS = 5;
const INIT_RETRY_DELAY_BASE_MS = 1000;

export function useTwilioVoice({ userId }: UseTwilioVoiceProps) {
  const setupCompleted = useRef(false);
  const initInProgress = useRef(false);
  const initAttempts = useRef(0);
  const tokenRefreshIntervalRef = useRef<number | null>(null);
  const lastRefreshAttempt = useRef<number>(0);
  const deviceRegistrationFailed = useRef(false);
  
  const { 
    setupBrowserEnvironment, 
    initializeDevice, 
    refreshToken, 
    shouldRefreshToken,
    tokenExpiryTime,
    isDeviceRegistered 
  } = useDeviceSetup();
  
  const { state, updateState, updateDevice, updateCallStatus, resetState } = useDeviceState();
  const { startCall } = useCallInitialization({ 
    userId, 
    updateCallStatus, 
    updateState,
    isDeviceRegistered
  });
  const callActions = useCallActions({ state, updateState });

  const reinitializeDevice = useCallback(async () => {
    if (!userId || initInProgress.current) return;
    
    console.log('Reinitializing Twilio device');
    
    // Destroy the existing device if it exists
    if (state.device) {
      try {
        console.log('Destroying existing device before reinitializing');
        state.device.destroy();
      } catch (err) {
        console.error('Error destroying device during reinitialization:', err);
      }
    }
    
    // Reset device state before reinitializing
    updateDevice(null);
    updateState({ isReady: false });
    
    // Attempt to set up device again
    setupCompleted.current = false;
    initInProgress.current = false;
    deviceRegistrationFailed.current = false;
    
    // We'll let the regular initialization effect take over
  }, [userId, state.device, updateDevice, updateState]);

  const handleTokenRefresh = useCallback(async () => {
    // Prevent multiple simultaneous refresh attempts
    const now = Date.now();
    if (now - lastRefreshAttempt.current < 10000) {
      console.log('Token refresh already attempted recently, skipping');
      return;
    }
    
    lastRefreshAttempt.current = now;
    
    if (!state.device || !userId) {
      console.warn('Cannot refresh token: device not initialized or no user ID');
      return;
    }
    
    try {
      console.log('Attempting token refresh');
      await refreshToken(state.device, userId);
      console.log('Token refreshed successfully');
      deviceRegistrationFailed.current = false;
    } catch (err) {
      console.error('Failed to refresh token:', err);
      updateState({ 
        error: 'Token refresh failed. Please try again.',
        isReady: false
      });
      
      // Show a user-friendly error message
      toast.error('Call system connection lost. Reconnecting...');
      
      // Try to reinitialize the device
      setupCompleted.current = false;
      initInProgress.current = false;
      deviceRegistrationFailed.current = true;
      setTimeout(() => reinitializeDevice(), 5000);
    }
  }, [state.device, userId, refreshToken, updateState, reinitializeDevice]);

  // Setup token refresh interval
  useEffect(() => {
    if (state.device && userId && tokenExpiryTime) {
      console.log('Setting up token refresh interval');
      
      // Clear any existing interval
      if (tokenRefreshIntervalRef.current) {
        window.clearInterval(tokenRefreshIntervalRef.current);
      }
      
      // Set new interval for regular checks
      tokenRefreshIntervalRef.current = window.setInterval(() => {
        if (shouldRefreshToken()) {
          handleTokenRefresh();
        }
      }, TOKEN_REFRESH_INTERVAL_MS);
      
      // Also refresh immediately if needed
      if (shouldRefreshToken()) {
        handleTokenRefresh();
      }
      
      return () => {
        if (tokenRefreshIntervalRef.current) {
          window.clearInterval(tokenRefreshIntervalRef.current);
          tokenRefreshIntervalRef.current = null;
        }
      };
    }
  }, [state.device, userId, tokenExpiryTime, shouldRefreshToken, handleTokenRefresh]);

  // Initialize device effect
  useEffect(() => {
    if (userId && !setupCompleted.current && !initInProgress.current) {
      const setupDevice = async () => {
        if (initInProgress.current) return;
        
        initInProgress.current = true;
        initAttempts.current += 1;
        
        // If we've reached max attempts, back off and set a flag
        if (initAttempts.current > MAX_INIT_ATTEMPTS) {
          console.warn(`Max initialization attempts (${MAX_INIT_ATTEMPTS}) reached, backing off`);
          deviceRegistrationFailed.current = true;
          initInProgress.current = false;
          updateState({ 
            error: 'Failed to connect to call system after multiple attempts. Please reload the page.',
            isReady: false 
          });
          return;
        }
        
        try {
          console.log(`Setting up Twilio device (attempt ${initAttempts.current}/${MAX_INIT_ATTEMPTS})`);
          updateCallStatus(CallStatus.IDLE);
          updateState({ error: null });
          
          setupBrowserEnvironment();
          console.log('Browser environment set up successfully');

          const newDevice = await initializeDevice(userId);
          console.log('Device initialized successfully');
          
          updateDevice(newDevice);
          setupCompleted.current = true;
          deviceRegistrationFailed.current = false;
          
          console.log('Twilio device setup completed');
        } catch (err: any) {
          console.error('Error setting up Twilio device:', err);
          
          // Check for specific token errors
          const isTokenError = err.code === 31204 || err.message?.includes('JWT is invalid');
          
          updateState({ 
            error: isTokenError ? 'Authentication error with call system. Please try again later.' : err.message,
            isReady: false
          });
          
          // Exponential backoff for retries
          const retryDelay = Math.min(
            INIT_RETRY_DELAY_BASE_MS * Math.pow(2, initAttempts.current),
            60000 // Max 1 minute
          );
          
          console.log(`Will retry device setup in ${retryDelay}ms (attempt ${initAttempts.current}/${MAX_INIT_ATTEMPTS})`);
          
          // Schedule retry with exponential backoff
          setTimeout(() => {
            initInProgress.current = false;
            // Only auto-retry for the first few attempts
            if (initAttempts.current <= 3) {
              setupDevice();
            } else {
              deviceRegistrationFailed.current = true;
            }
          }, retryDelay);
          return;
        } finally {
          initInProgress.current = false;
        }
      };

      setupDevice();
    }
    
    return () => {
      // Clear token refresh interval
      if (tokenRefreshIntervalRef.current) {
        window.clearInterval(tokenRefreshIntervalRef.current);
        tokenRefreshIntervalRef.current = null;
      }
      
      // Destroy device
      if (state.device) {
        try {
          console.log('Destroying Twilio device');
          state.device.destroy();
        } catch (err) {
          console.error('Error destroying Twilio device:', err);
        }
      }
    };
  }, [userId, setupBrowserEnvironment, initializeDevice, state.device, updateState, updateDevice, updateCallStatus]);

  // Add effect to retry initialization periodically if we've failed
  useEffect(() => {
    if (userId && deviceRegistrationFailed.current && !initInProgress.current && initAttempts.current <= MAX_INIT_ATTEMPTS) {
      const retryTimer = setTimeout(() => {
        console.log('Attempting to recover device registration');
        setupCompleted.current = false;
        initInProgress.current = false;
        reinitializeDevice();
      }, 30000); // Retry every 30 seconds
      
      return () => clearTimeout(retryTimer);
    }
  }, [userId, reinitializeDevice]);

  return {
    ...state,
    startCall,
    ...callActions,
  };
}
