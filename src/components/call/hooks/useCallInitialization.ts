
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
      const errorMsg = 'Call system not ready. Please try again in a moment.';
      toast.error(errorMsg);
      updateState({ 
        error: 'Device not registered',
        callStatus: CallStatus.FAILED 
      });
      console.error(errorMsg);
      return;
    }

    try {
      console.log(`Initiating call to ${recipientId}`);
      updateCallStatus(CallStatus.CONNECTING);
      
      // Add a small delay to ensure UI state is updated before proceeding
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Verify device is still registered before making the call
      if (!isDeviceRegistered) {
        throw new Error('Device lost registration before call could begin');
      }
      
      // Call the voice-call function to initiate the call
      const { data, error: callError } = await supabase.functions.invoke('voice-call', {
        body: { 
          from: userId, 
          to: recipientId,
          retryCount: 0
        }
      });

      if (callError) {
        // Check for JWT errors specifically
        if (callError.message?.includes('JWT') || 
            callError.message?.includes('token') || 
            callError.message?.includes('auth')) {
          throw new Error('Authentication failed. Please try again in a moment.');
        }
        throw new Error(callError.message || 'Failed to initiate call');
      }
      
      if (!data?.success) {
        throw new Error('Call service returned unsuccessful response');
      }

      console.log('Call initiated successfully with call SID:', data.callSid);
      
      // Set remote participant first
      updateState({ remoteParticipant: recipientId });
      
      // Then update call status after a short delay
      setTimeout(() => {
        updateCallStatus(CallStatus.RINGING);
      }, 500);

    } catch (err: any) {
      console.error('Error starting call:', err);
      
      // Create user-friendly error message
      let errorMessage = 'Call failed';
      if (err.message?.includes('JWT') || err.message?.includes('token') || err.message?.includes('auth')) {
        errorMessage = 'Authentication error. Please try again in a moment.';
      } else if (err.message?.includes('not ready') || err.message?.includes('registration')) {
        errorMessage = 'Call system not ready. Please try again in a moment.';
      } else {
        errorMessage = `Call failed: ${err.message}`;
      }
      
      updateState({ 
        error: err.message,
        callStatus: CallStatus.FAILED 
      });
      
      toast.error(errorMessage);
    }
  }, [userId, updateCallStatus, updateState, isDeviceRegistered]);

  return { startCall };
}
