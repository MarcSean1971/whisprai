
import { useEffect, useRef, useState, useCallback } from 'react';
import { useDeviceSetup } from './useDeviceSetup';
import { useDeviceState } from './useDeviceState';
import { useCallActions } from './useCallActions';
import { useCallInitialization } from './useCallInitialization';
import { UseTwilioVoiceProps, CallStatus } from '../types';
import { toast } from 'sonner';

// Token refresh interval (every 3 minutes)
const TOKEN_REFRESH_INTERVAL_MS = 3 * 60 * 1000;

export function useTwilioVoice({ userId }: UseTwilioVoiceProps) {
  const setupCompleted = useRef(false);
  const initInProgress = useRef(false);
  const initAttempts = useRef(0);
  const tokenRefreshIntervalRef = useRef<number | null>(null);
  const lastRefreshAttempt = useRef<number>(0);
  
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
    }
  }, [state.device, userId, refreshToken, updateState]);

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
        
        try {
          console.log(`Setting up Twilio device (attempt ${initAttempts.current})`);
          updateCallStatus(CallStatus.IDLE);
          updateState({ error: null });
          
          setupBrowserEnvironment();
          console.log('Browser environment set up successfully');

          const newDevice = await initializeDevice(userId);
          console.log('Device initialized successfully');
          
          updateDevice(newDevice);
          setupCompleted.current = true;
          
          console.log('Twilio device setup completed');
        } catch (err: any) {
          console.error('Error setting up Twilio device:', err);
          updateState({ 
            error: err.message,
            isReady: false
          });
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

  return {
    ...state,
    startCall,
    ...callActions,
  };
}

