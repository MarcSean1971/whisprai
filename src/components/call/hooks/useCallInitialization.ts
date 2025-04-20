
import { useCallback } from 'react';
import { toast } from 'sonner';
import { CallStatus } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { TwilioVoiceState } from '../types';

export interface UseCallInitializationProps {
  userId: string;
  updateCallStatus: (status: CallStatus) => void;
  updateState: (updates: Partial<TwilioVoiceState>) => void;
  isDeviceRegistered: boolean;
}

export function useCallInitialization({ 
  userId, 
  updateCallStatus, 
  updateState,
  isDeviceRegistered 
}: UseCallInitializationProps) {
  const startCall = useCallback(async (recipientId: string) => {
    if (!userId) {
      toast.error('You must be logged in to make calls');
      return;
    }

    if (!isDeviceRegistered) {
      toast.error('Call system not ready. Please try again in a moment.');
      updateState({ 
        error: 'Device not registered',
        callStatus: CallStatus.FAILED 
      });
      return;
    }

    try {
      console.log(`Initiating call to ${recipientId}`);
      updateCallStatus(CallStatus.CONNECTING);
      
      // Add a small delay to ensure UI state is updated before proceeding
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Call the voice-call function to initiate the call
      const { data, error: callError } = await supabase.functions.invoke('voice-call', {
        body: { 
          from: userId, 
          to: recipientId,
          retryCount: 0
        }
      });

      if (callError || !data?.success) {
        throw new Error(callError?.message || 'Failed to initiate call');
      }

      console.log('Call initiated successfully with call SID:', data.callSid);
      
      // Set remote participant first
      updateState({ remoteParticipant: recipientId });
      
      // Then update call status after a short delay
      setTimeout(() => {
        updateState({ 
          callStatus: CallStatus.RINGING 
        });
      }, 500);

    } catch (err: any) {
      console.error('Error starting call:', err);
      updateState({ 
        error: err.message,
        callStatus: CallStatus.FAILED 
      });
      toast.error(`Call failed: ${err.message}`);
    }
  }, [userId, updateCallStatus, updateState, isDeviceRegistered]);

  return { startCall };
}
