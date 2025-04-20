
import { useCallback } from 'react';
import { toast } from 'sonner';
import { CallStatus } from '../types';
import { TwilioVoiceState } from '../types';

interface UseCallActionsProps {
  state: TwilioVoiceState;
  updateState: (updates: Partial<TwilioVoiceState>) => void;
}

export function useCallActions({ state, updateState }: UseCallActionsProps) {
  const answerCall = useCallback(() => {
    if (state.activeCall && state.callStatus === CallStatus.RINGING) {
      try {
        console.log('Accepting incoming call');
        state.activeCall.accept();
        updateState({ callStatus: CallStatus.IN_PROGRESS });
      } catch (err: any) {
        console.error('Error accepting call:', err);
        updateState({ 
          error: err.message,
          callStatus: CallStatus.FAILED 
        });
        toast.error(`Error accepting call: ${err.message}`);
      }
    }
  }, [state.activeCall, state.callStatus, updateState]);

  const endCall = useCallback(() => {
    if (state.activeCall) {
      try {
        console.log('Ending call');
        state.activeCall.disconnect();
        updateState({ 
          callStatus: CallStatus.COMPLETED,
          activeCall: null,
          remoteParticipant: null 
        });
      } catch (err: any) {
        console.error('Error ending call:', err);
        updateState({ error: err.message });
        toast.error(`Error ending call: ${err.message}`);
        // Force state reset even if there was an error disconnecting
        updateState({ 
          callStatus: CallStatus.COMPLETED,
          activeCall: null,
          remoteParticipant: null 
        });
      }
    }
  }, [state.activeCall, updateState]);

  const rejectCall = useCallback(() => {
    if (state.activeCall && state.callStatus === CallStatus.RINGING) {
      try {
        console.log('Rejecting call');
        state.activeCall.reject();
        updateState({ 
          callStatus: CallStatus.IDLE,
          activeCall: null,
          remoteParticipant: null 
        });
      } catch (err: any) {
        console.error('Error rejecting call:', err);
        updateState({ error: err.message });
        toast.error(`Error rejecting call: ${err.message}`);
        // Force state reset even if there was an error rejecting
        updateState({ 
          callStatus: CallStatus.IDLE,
          activeCall: null,
          remoteParticipant: null 
        });
      }
    }
  }, [state.activeCall, state.callStatus, updateState]);

  const toggleMute = useCallback(() => {
    if (state.activeCall) {
      try {
        if (state.isMuted) {
          console.log('Unmuting call');
          state.activeCall.mute(false);
          updateState({ isMuted: false });
        } else {
          console.log('Muting call');
          state.activeCall.mute(true);
          updateState({ isMuted: true });
        }
      } catch (err: any) {
        console.error('Error toggling mute:', err);
        updateState({ error: err.message });
        toast.error(`Error toggling mute: ${err.message}`);
      }
    }
  }, [state.activeCall, state.isMuted, updateState]);

  return {
    answerCall,
    endCall,
    rejectCall,
    toggleMute
  };
}
