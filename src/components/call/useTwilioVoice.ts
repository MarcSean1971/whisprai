import { useState, useEffect, useCallback } from 'react';
import { Device } from 'twilio-client';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export enum CallStatus {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  RINGING = 'ringing',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  BUSY = 'busy',
  FAILED = 'failed',
  CANCELED = 'canceled',
  NO_ANSWER = 'no-answer'
}

interface UseTwilioVoiceProps {
  userId: string;
}

export function useTwilioVoice({ userId }: UseTwilioVoiceProps) {
  const [device, setDevice] = useState<Device | null>(null);
  const [activeCall, setActiveCall] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [remoteParticipant, setRemoteParticipant] = useState<string | null>(null);

  // Initialize the Twilio device
  const setupDevice = useCallback(async () => {
    try {
      setCallStatus(CallStatus.IDLE);
      setError(null);

      // Fetch access token from our edge function
      const { data, error: tokenError } = await supabase.functions.invoke('twilio-token', {
        body: { identity: userId }
      });

      if (tokenError || !data?.token) {
        throw new Error(tokenError?.message || 'Failed to get access token');
      }

      // Add a polyfill to avoid issues with the Twilio client
      if (typeof window !== 'undefined') {
        // @ts-ignore - This is necessary for compatibility with the Twilio client
        window.EventEmitter = null;
      }

      // Initialize the device with the token
      const newDevice = new Device();
      
      newDevice.on('ready', () => {
        console.log('Twilio device is ready for calls');
        setIsReady(true);
      });

      newDevice.on('error', (error) => {
        console.error('Twilio device error:', error);
        setError(error.message);
        toast.error(`Call error: ${error.message}`);
      });

      newDevice.on('incoming', (call) => {
        console.log('Incoming call from:', call.parameters.From);
        setActiveCall(call);
        setCallStatus(CallStatus.RINGING);
        setRemoteParticipant(call.parameters.From?.replace('client:', ''));
        
        // Set up call event listeners
        call.on('accept', () => {
          setCallStatus(CallStatus.IN_PROGRESS);
        });

        call.on('disconnect', () => {
          setCallStatus(CallStatus.COMPLETED);
          setActiveCall(null);
          setRemoteParticipant(null);
        });

        call.on('cancel', () => {
          setCallStatus(CallStatus.CANCELED);
          setActiveCall(null);
          setRemoteParticipant(null);
        });

        // Auto play a ringtone
        const ringtone = new Audio('/sounds/ringtone.mp3');
        ringtone.loop = true;
        ringtone.play().catch(e => console.error('Error playing ringtone:', e));
        
        // Stop the ringtone when call is accepted or ended
        const stopRingtone = () => {
          ringtone.pause();
          ringtone.currentTime = 0;
        };
        
        call.on('accept', stopRingtone);
        call.on('disconnect', stopRingtone);
        call.on('cancel', stopRingtone);
        call.on('reject', stopRingtone);
      });

      // Use a try-catch block to handle potential issues during setup
      try {
        // Setup the device with the token
        await newDevice.setup(data.token, {
          // Adding debug option to help with troubleshooting
          debug: true
        });
        setDevice(newDevice);
      } catch (setupError) {
        console.error('Error during Twilio device setup:', setupError);
        setError(setupError.message);
        toast.error(`Setup error: ${setupError.message}`);
      }
      
    } catch (err) {
      console.error('Error setting up Twilio device:', err);
      setError(err.message);
      toast.error(`Setup error: ${err.message}`);
    }
  }, [userId]);

  // Initialize on component mount with proper cleanup
  useEffect(() => {
    if (userId) {
      setupDevice();
    }
    
    // Clean up on unmount
    return () => {
      if (device) {
        try {
          device.destroy();
        } catch (err) {
          console.error('Error destroying Twilio device:', err);
        }
      }
    };
  }, [userId, setupDevice]);

  // Start an outgoing call
  const startCall = useCallback(async (recipientId: string) => {
    if (!device || !isReady) {
      toast.error('Device not ready for calls');
      return;
    }

    try {
      setCallStatus(CallStatus.CONNECTING);
      
      // Make call using our edge function for better control
      const { data, error: callError } = await supabase.functions.invoke('voice-call', {
        body: { from: userId, to: recipientId }
      });

      if (callError || !data?.success) {
        throw new Error(callError?.message || 'Failed to initiate call');
      }

      setRemoteParticipant(recipientId);
      setCallStatus(CallStatus.RINGING);
      
      // The actual call connection will be handled by the device's incoming event
    } catch (err) {
      console.error('Error starting call:', err);
      setError(err.message);
      setCallStatus(CallStatus.FAILED);
      toast.error(`Call error: ${err.message}`);
    }
  }, [device, isReady, userId]);

  // Answer an incoming call
  const answerCall = useCallback(() => {
    if (activeCall && callStatus === CallStatus.RINGING) {
      activeCall.accept();
      setCallStatus(CallStatus.IN_PROGRESS);
    }
  }, [activeCall, callStatus]);

  // End a call
  const endCall = useCallback(() => {
    if (activeCall) {
      activeCall.disconnect();
      setCallStatus(CallStatus.COMPLETED);
      setActiveCall(null);
      setRemoteParticipant(null);
    }
  }, [activeCall]);

  // Reject an incoming call
  const rejectCall = useCallback(() => {
    if (activeCall && callStatus === CallStatus.RINGING) {
      activeCall.reject();
      setCallStatus(CallStatus.IDLE);
      setActiveCall(null);
      setRemoteParticipant(null);
    }
  }, [activeCall, callStatus]);

  // Toggle mute status
  const toggleMute = useCallback(() => {
    if (activeCall) {
      if (isMuted) {
        activeCall.mute(false);
        setIsMuted(false);
      } else {
        activeCall.mute(true);
        setIsMuted(true);
      }
    }
  }, [activeCall, isMuted]);

  return {
    isReady,
    callStatus,
    error,
    isMuted,
    remoteParticipant,
    startCall,
    answerCall,
    endCall,
    rejectCall,
    toggleMute,
    setupDevice
  };
}
