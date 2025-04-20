
import { useEffect, useRef } from 'react';
import { useDeviceSetup } from './useDeviceSetup';
import { useDeviceState } from './useDeviceState';
import { useCallActions } from './useCallActions';
import { useCallInitialization } from './useCallInitialization';
import { UseTwilioVoiceProps } from '../types';

export function useTwilioVoice({ userId }: UseTwilioVoiceProps) {
  const setupCompleted = useRef(false);
  const initInProgress = useRef(false);
  const initAttempts = useRef(0);
  
  const { setupBrowserEnvironment, initializeDevice } = useDeviceSetup();
  const { state, updateState, updateDevice, updateCallStatus, resetState } = useDeviceState();
  const { startCall } = useCallInitialization({ 
    userId, 
    updateCallStatus, 
    updateState 
  });
  const callActions = useCallActions({ state, updateState });

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

export { CallStatus };
