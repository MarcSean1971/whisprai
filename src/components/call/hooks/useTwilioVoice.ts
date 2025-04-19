
import { useState, useEffect, useCallback, useRef } from 'react';
import { Device } from 'twilio-client';
import { toast } from 'sonner';
import { useDeviceSetup } from './useDeviceSetup';
import { useCallHandlers } from './useCallHandlers';
import { CallStatus, UseTwilioVoiceProps, TwilioVoiceState } from '../types';
import { supabase } from '@/integrations/supabase/client';

export function useTwilioVoice({ userId }: UseTwilioVoiceProps) {
  const [state, setState] = useState<TwilioVoiceState>({
    device: null,
    activeCall: null,
    isReady: false,
    callStatus: CallStatus.IDLE,
    error: null,
    isMuted: false,
    remoteParticipant: null
  });
  
  const setupCompleted = useRef(false);
  const initInProgress = useRef(false);
  const initAttempts = useRef(0);

  const { setupBrowserEnvironment, initializeDevice } = useDeviceSetup();
  const { setupCallHandlers } = useCallHandlers({
    device: state.device,
    setCallStatus: (status) => setState(prev => ({ ...prev, callStatus: status })),
    setActiveCall: (call) => setState(prev => ({ ...prev, activeCall: call })),
    setRemoteParticipant: (participant) => setState(prev => ({ ...prev, remoteParticipant: participant })),
    setError: (error) => setState(prev => ({ ...prev, error })),
    setIsReady: (ready) => setState(prev => ({ ...prev, isReady: ready }))
  });

  const setupDevice = useCallback(async () => {
    // Don't try to set up if userId is not available
    if (!userId) {
      console.log('No user ID available for Twilio setup');
      return;
    }
    
    // Prevent multiple initialization attempts happening simultaneously
    if (initInProgress.current) {
      console.log('Device initialization already in progress');
      return;
    }
    
    initInProgress.current = true;
    initAttempts.current += 1;
    
    try {
      console.log(`Setting up Twilio device (attempt ${initAttempts.current})`);
      setState(prev => ({ ...prev, callStatus: CallStatus.IDLE, error: null }));
      
      setupBrowserEnvironment();
      console.log('Browser environment set up successfully');

      const newDevice = await initializeDevice(userId);
      console.log('Device initialized successfully');
      
      setupCallHandlers(newDevice);
      console.log('Call handlers set up successfully');
      
      setState(prev => ({ ...prev, device: newDevice }));
      setupCompleted.current = true;
      
      console.log('Twilio device setup completed');
    } catch (err: any) {
      console.error('Error setting up Twilio device:', err);
      setState(prev => ({ ...prev, error: err.message }));
      
      if (initAttempts.current < 3) {
        // Schedule a retry with exponential backoff
        const delay = Math.pow(2, initAttempts.current) * 1000;
        console.log(`Will retry device setup in ${delay}ms`);
        
        setTimeout(() => {
          initInProgress.current = false;
          setupDevice();
        }, delay);
      } else {
        toast.error(`Could not initialize call system: ${err.message}`);
      }
    } finally {
      initInProgress.current = false;
    }
  }, [userId, setupBrowserEnvironment, initializeDevice, setupCallHandlers]);

  useEffect(() => {
    // Only attempt setup if userId is available and setup hasn't been completed yet
    if (userId && !setupCompleted.current && !initInProgress.current) {
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
  }, [userId, setupDevice, state.device]);

  const startCall = useCallback(async (recipientId: string) => {
    if (!userId) {
      toast.error('You must be logged in to make calls');
      return;
    }
    
    if (!state.device) {
      console.log('Device not available, attempting to set up');
      await setupDevice();
    }
    
    if (!state.isReady) {
      toast.error('Call system is initializing. Please try again in a moment.');
      return;
    }

    try {
      console.log(`Starting call to recipient: ${recipientId}`);
      setState(prev => ({ ...prev, callStatus: CallStatus.CONNECTING }));
      
      const { data, error: callError } = await supabase.functions.invoke('voice-call', {
        body: { from: userId, to: recipientId }
      });

      if (callError || !data?.success) {
        throw new Error(callError?.message || 'Failed to initiate call');
      }

      console.log('Call initiated successfully with call SID:', data.callSid);
      setState(prev => ({ 
        ...prev, 
        remoteParticipant: recipientId,
        callStatus: CallStatus.RINGING 
      }));
    } catch (err: any) {
      console.error('Error starting call:', err);
      setState(prev => ({ 
        ...prev, 
        error: err.message,
        callStatus: CallStatus.FAILED 
      }));
      toast.error(`Call failed: ${err.message}`);
    }
  }, [state.device, state.isReady, userId, setupDevice]);

  const callActions = {
    answerCall: useCallback(() => {
      if (state.activeCall && state.callStatus === CallStatus.RINGING) {
        try {
          console.log('Accepting incoming call');
          state.activeCall.accept();
          setState(prev => ({ ...prev, callStatus: CallStatus.IN_PROGRESS }));
        } catch (err: any) {
          console.error('Error accepting call:', err);
          setState(prev => ({ 
            ...prev, 
            error: err.message,
            callStatus: CallStatus.FAILED 
          }));
          toast.error(`Error accepting call: ${err.message}`);
        }
      }
    }, [state.activeCall, state.callStatus]),

    endCall: useCallback(() => {
      if (state.activeCall) {
        try {
          console.log('Ending call');
          state.activeCall.disconnect();
          setState(prev => ({ 
            ...prev,
            callStatus: CallStatus.COMPLETED,
            activeCall: null,
            remoteParticipant: null 
          }));
        } catch (err: any) {
          console.error('Error ending call:', err);
          setState(prev => ({ ...prev, error: err.message }));
          toast.error(`Error ending call: ${err.message}`);
          // Force state reset even if there was an error disconnecting
          setState(prev => ({ 
            ...prev,
            callStatus: CallStatus.COMPLETED,
            activeCall: null,
            remoteParticipant: null 
          }));
        }
      }
    }, [state.activeCall]),

    rejectCall: useCallback(() => {
      if (state.activeCall && state.callStatus === CallStatus.RINGING) {
        try {
          console.log('Rejecting call');
          state.activeCall.reject();
          setState(prev => ({ 
            ...prev,
            callStatus: CallStatus.IDLE,
            activeCall: null,
            remoteParticipant: null 
          }));
        } catch (err: any) {
          console.error('Error rejecting call:', err);
          setState(prev => ({ ...prev, error: err.message }));
          toast.error(`Error rejecting call: ${err.message}`);
          // Force state reset even if there was an error rejecting
          setState(prev => ({ 
            ...prev,
            callStatus: CallStatus.IDLE,
            activeCall: null,
            remoteParticipant: null 
          }));
        }
      }
    }, [state.activeCall, state.callStatus]),

    toggleMute: useCallback(() => {
      if (state.activeCall) {
        try {
          if (state.isMuted) {
            console.log('Unmuting call');
            state.activeCall.mute(false);
            setState(prev => ({ ...prev, isMuted: false }));
          } else {
            console.log('Muting call');
            state.activeCall.mute(true);
            setState(prev => ({ ...prev, isMuted: true }));
          }
        } catch (err: any) {
          console.error('Error toggling mute:', err);
          setState(prev => ({ ...prev, error: err.message }));
          toast.error(`Error toggling mute: ${err.message}`);
        }
      }
    }, [state.activeCall, state.isMuted])
  };

  return {
    ...state,
    startCall,
    ...callActions,
    setupDevice
  };
}

export { CallStatus };
