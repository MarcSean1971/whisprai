import { useState, useEffect, useCallback } from 'react';
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
    try {
      setState(prev => ({ ...prev, callStatus: CallStatus.IDLE, error: null }));
      setupBrowserEnvironment();

      const newDevice = await initializeDevice(userId);
      setupCallHandlers(newDevice);
      setState(prev => ({ ...prev, device: newDevice }));
    } catch (err: any) {
      console.error('Error setting up Twilio device:', err);
      setState(prev => ({ ...prev, error: err.message }));
      toast.error(`Setup error: ${err.message}`);
    }
  }, [userId, setupBrowserEnvironment, initializeDevice, setupCallHandlers]);

  useEffect(() => {
    if (userId) {
      setupDevice();
    }
    
    return () => {
      if (state.device) {
        try {
          state.device.destroy();
        } catch (err) {
          console.error('Error destroying Twilio device:', err);
        }
      }
    };
  }, [userId, setupDevice]);

  const startCall = useCallback(async (recipientId: string) => {
    if (!state.device || !state.isReady) {
      toast.error('Device not ready for calls');
      return;
    }

    try {
      setState(prev => ({ ...prev, callStatus: CallStatus.CONNECTING }));
      
      const { data, error: callError } = await supabase.functions.invoke('voice-call', {
        body: { from: userId, to: recipientId }
      });

      if (callError || !data?.success) {
        throw new Error(callError?.message || 'Failed to initiate call');
      }

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
      toast.error(`Call error: ${err.message}`);
    }
  }, [state.device, state.isReady, userId]);

  const callActions = {
    answerCall: useCallback(() => {
      if (state.activeCall && state.callStatus === CallStatus.RINGING) {
        try {
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
            state.activeCall.mute(false);
            setState(prev => ({ ...prev, isMuted: false }));
          } else {
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
