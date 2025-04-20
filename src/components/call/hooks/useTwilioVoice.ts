
import { useEffect, useRef, useState, useCallback } from 'react';
import { useDeviceSetup } from './useDeviceSetup';
import { useDeviceState } from './useDeviceState';
import { useCallActions } from './useCallActions';
import { useCallInitialization } from './useCallInitialization';
import { UseTwilioVoiceProps, CallStatus } from '../types';
import { toast } from 'sonner';

// Configuration constants
const TOKEN_REFRESH_INTERVAL_MS = 3 * 60 * 1000; // Check token every 3 minutes
const MAX_INIT_ATTEMPTS = 3;
const INIT_RETRY_DELAY_BASE_MS = 2000;
const MAX_RETRY_DELAY_MS = 10000;

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
    isDeviceRegistered,
    validateToken,
    currentToken
  } = useDeviceSetup();
  
  const { state, updateState, updateDevice, updateCallStatus, resetState } = useDeviceState();
  const { startCall } = useCallInitialization({ 
    userId, 
    updateCallStatus, 
    updateState,
    isDeviceRegistered,
    validateToken,
    currentToken: currentToken.current
  });
  const callActions = useCallActions({ state, updateState });

  const reinitializeDevice = useCallback(async () => {
    if (!userId || initInProgress.current) return;
    
    console.log('Reinitializing Twilio device');
    
    // Clean up existing device
    if (state.device) {
      try {
        console.log('Destroying existing device before reinitializing');
        state.device.destroy();
      } catch (err) {
        console.error('Error destroying device during reinitialization:', err);
      }
    }
    
    // Reset state
    updateDevice(null);
    updateState({ isReady: false });
    setupCompleted.current = false;
    initInProgress.current = false;
    deviceRegistrationFailed.current = false;
    
  }, [userId, state.device, updateDevice, updateState]);

  const handleTokenRefresh = useCallback(async () => {
    const now = Date.now();
    if (now - lastRefreshAttempt.current < 10000) {
      console.log('Token refresh attempted recently, skipping');
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
        error: 'Token refresh failed',
        isReady: false
      });
      
      deviceRegistrationFailed.current = true;
      setTimeout(() => reinitializeDevice(), 5000);
    }
  }, [state.device, userId, refreshToken, updateState, reinitializeDevice]);

  useEffect(() => {
    if (state.device && userId && tokenExpiryTime) {
      console.log('Setting up token refresh interval');
      
      if (tokenRefreshIntervalRef.current) {
        window.clearInterval(tokenRefreshIntervalRef.current);
      }
      
      tokenRefreshIntervalRef.current = window.setInterval(() => {
        if (shouldRefreshToken()) {
          handleTokenRefresh();
        }
      }, TOKEN_REFRESH_INTERVAL_MS);
      
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

  useEffect(() => {
    if (!userId || setupCompleted.current || initInProgress.current) return;

    const setupDevice = async () => {
      if (initInProgress.current) return;
      
      initInProgress.current = true;
      initAttempts.current += 1;
      
      if (initAttempts.current > MAX_INIT_ATTEMPTS) {
        console.warn(`Max initialization attempts (${MAX_INIT_ATTEMPTS}) reached, backing off`);
        deviceRegistrationFailed.current = true;
        initInProgress.current = false;
        updateState({ 
          error: 'Failed to initialize call system',
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
        updateState({ isReady: true });
        setupCompleted.current = true;
        deviceRegistrationFailed.current = false;
        
      } catch (err: any) {
        console.error('Error setting up Twilio device:', err);
        
        // Check if error is JWT/token related
        const isTokenError = err.message?.includes('JWT') || 
                            err.message?.includes('token') || 
                            err.message?.includes('Invalid') ||
                            err.message?.includes('auth');
        
        let waitTime = Math.min(
          INIT_RETRY_DELAY_BASE_MS * Math.pow(2, initAttempts.current - 1),
          MAX_RETRY_DELAY_MS
        );
        
        // For token errors, use a longer backoff
        if (isTokenError) {
          waitTime = Math.min(waitTime * 2, 30000);
          console.warn(`Token error detected, using extended retry delay of ${waitTime}ms`);
          
          // Show a user-friendly error
          toast.error('Authentication issue. Retrying in a moment...');
        }
        
        updateState({ 
          error: err.message || 'Failed to initialize call system',
          isReady: false
        });
        
        console.log(`Will retry device setup in ${waitTime}ms`);
        
        setTimeout(() => {
          initInProgress.current = false;
          if (initAttempts.current <= MAX_INIT_ATTEMPTS) {
            console.log('Retry timer fired, will attempt setup again');
            setupDevice();
          } else {
            deviceRegistrationFailed.current = true;
          }
        }, waitTime);
        return;
      }
      
      initInProgress.current = false;
    };

    setupDevice();
    
  }, [userId, setupBrowserEnvironment, initializeDevice, updateState, updateDevice, updateCallStatus]);

  useEffect(() => {
    if (userId && deviceRegistrationFailed.current && !initInProgress.current) {
      const retryTimer = setTimeout(() => {
        console.log('Attempting to recover device registration');
        setupCompleted.current = false;
        initInProgress.current = false;
        initAttempts.current = 0;
        reinitializeDevice();
      }, 30000);
      
      return () => clearTimeout(retryTimer);
    }
  }, [userId, reinitializeDevice]);

  useEffect(() => {
    return () => {
      if (tokenRefreshIntervalRef.current) {
        window.clearInterval(tokenRefreshIntervalRef.current);
        tokenRefreshIntervalRef.current = null;
      }
      
      if (state.device) {
        try {
          console.log('Cleaning up Twilio device');
          state.device.destroy();
        } catch (err) {
          console.error('Error cleaning up device:', err);
        }
      }
    };
  }, [state.device]);

  return {
    ...state,
    startCall,
    ...callActions,
  };
}
