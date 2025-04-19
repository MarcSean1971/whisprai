
import { useCallback } from 'react';
import { Device } from 'twilio-client';
import { toast } from 'sonner';
import { CallStatus } from '../types';

interface UseCallHandlersProps {
  device: Device | null;
  setCallStatus: (status: CallStatus) => void;
  setActiveCall: (call: any) => void;
  setRemoteParticipant: (participant: string | null) => void;
  setError: (error: string | null) => void;
  setIsReady: (ready: boolean) => void;
}

export function useCallHandlers({
  device,
  setCallStatus,
  setActiveCall,
  setRemoteParticipant,
  setError,
  setIsReady
}: UseCallHandlersProps) {
  const setupCallHandlers = useCallback((newDevice: Device) => {
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
      
      setupIncomingCallHandlers(call);
    });
  }, [setIsReady, setError, setActiveCall, setCallStatus, setRemoteParticipant]);

  const setupIncomingCallHandlers = useCallback((call: any) => {
    const ringtone = new Audio('/sounds/ringtone.mp3');
    ringtone.loop = true;
    ringtone.play().catch(e => console.error('Error playing ringtone:', e));
    
    const stopRingtone = () => {
      ringtone.pause();
      ringtone.currentTime = 0;
    };
    
    call.on('accept', () => {
      setCallStatus(CallStatus.IN_PROGRESS);
      stopRingtone();
    });

    call.on('disconnect', () => {
      setCallStatus(CallStatus.COMPLETED);
      setActiveCall(null);
      setRemoteParticipant(null);
      stopRingtone();
    });

    call.on('cancel', () => {
      setCallStatus(CallStatus.CANCELED);
      setActiveCall(null);
      setRemoteParticipant(null);
      stopRingtone();
    });

    call.on('reject', stopRingtone);
  }, [setCallStatus, setActiveCall, setRemoteParticipant]);

  return {
    setupCallHandlers
  };
}
