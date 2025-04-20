
import { useCallback } from 'react';
import { toast } from 'sonner';
import { CallStatus } from '../types';
import { supabase } from '@/integrations/supabase/client';

interface UseCallInitializationProps {
  userId: string;
  updateCallStatus: (status: CallStatus) => void;
  updateState: (updates: any) => void;
}

export function useCallInitialization({ 
  userId, 
  updateCallStatus, 
  updateState 
}: UseCallInitializationProps) {
  const startCall = useCallback(async (recipientId: string) => {
    if (!userId) {
      toast.error('You must be logged in to make calls');
      return;
    }

    try {
      console.log(`Initiating call to ${recipientId}`);
      updateCallStatus(CallStatus.CONNECTING);
      
      // Call the voice-call function to initiate the call
      const { data, error: callError } = await supabase.functions.invoke('voice-call', {
        body: { 
          from: userId, 
          to: recipientId,
          retryCount: 0 // Add retry count for the edge function
        }
      });

      if (callError || !data?.success) {
        throw new Error(callError?.message || 'Failed to initiate call');
      }

      console.log('Call initiated successfully with call SID:', data.callSid);
      updateState({ 
        remoteParticipant: recipientId,
        callStatus: CallStatus.RINGING 
      });
    } catch (err: any) {
      console.error('Error starting call:', err);
      updateState({ 
        error: err.message,
        callStatus: CallStatus.FAILED 
      });
      toast.error(`Call failed: ${err.message}`);
    }
  }, [userId, updateCallStatus, updateState]);

  return { startCall };
}
