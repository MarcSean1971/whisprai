
import { useEffect } from 'react';
import { toast } from 'sonner';
import { CallStatus } from '@/components/call/types';
import { useCallStore } from './callStore';

export function useCallProviderEffects({
  twilioCallStatus,
  callStatus,
  recipientId,
  isReady,
  showActiveCall,
  twilioStartCall,
  updateCallStatus,
  remoteParticipant,
  showIncomingCall,
  twilioAnswerCall,
  twilioRejectCall,
  twilioEndCall,
  twilioToggleMute,
  twilioError,
}: {
  twilioCallStatus: CallStatus;
  callStatus: CallStatus;
  recipientId: string | null;
  isReady: boolean;
  showActiveCall: boolean;
  twilioStartCall: (recipientId: string) => void;
  updateCallStatus: (status: CallStatus) => void;
  remoteParticipant: string | null;
  showIncomingCall: boolean;
  twilioAnswerCall: () => void;
  twilioRejectCall: () => void;
  twilioEndCall: () => void;
  twilioToggleMute: () => void;
  twilioError: string | null;
}) {
  // Handle call initiation
  useEffect(() => {
    if (callStatus === CallStatus.CONNECTING && 
        recipientId && 
        isReady && 
        showActiveCall) {
      try {
        twilioStartCall(recipientId);
      } catch (error) {
        console.error('Error starting call:', error);
        toast.error(`Failed to start call: ${error.message}`);
        updateCallStatus(CallStatus.FAILED);
      }
    }
  }, [callStatus, recipientId, isReady, showActiveCall, twilioStartCall, updateCallStatus]);

  // Handle call status changes
  useEffect(() => {
    if (twilioCallStatus !== callStatus) {
      updateCallStatus(twilioCallStatus);
      
      switch (twilioCallStatus) {
        case CallStatus.FAILED:
          toast.error("Call failed");
          break;
        case CallStatus.COMPLETED:
          toast.info("Call ended");
          break;
        case CallStatus.CANCELED:
          toast.info("Call canceled");
          break;
      }
    }
  }, [twilioCallStatus, callStatus, updateCallStatus]);

  // Handle incoming calls
  useEffect(() => {
    if (twilioCallStatus === CallStatus.RINGING && remoteParticipant && !showIncomingCall) {
      useCallStore.getState().receiveCall(remoteParticipant);
    }
  }, [twilioCallStatus, remoteParticipant, showIncomingCall]);

  // Handle call actions
  useEffect(() => {
    const originalAcceptCall = useCallStore.getState().acceptCall;
    const originalRejectCall = useCallStore.getState().rejectCall;
    const originalEndCall = useCallStore.getState().endCall;
    const originalToggleMute = useCallStore.getState().toggleMute;
    
    useCallStore.setState({
      acceptCall: () => {
        try {
          twilioAnswerCall();
        } catch (error) {
          console.error('Error in acceptCall:', error);
        }
        originalAcceptCall();
      },
      rejectCall: () => {
        try {
          twilioRejectCall();
        } catch (error) {
          console.error('Error in rejectCall:', error);
        }
        originalRejectCall();
      },
      endCall: () => {
        try {
          twilioEndCall();
        } catch (error) {
          console.error('Error in endCall:', error);
        }
        originalEndCall();
      },
      toggleMute: () => {
        try {
          twilioToggleMute();
        } catch (error) {
          console.error('Error in toggleMute:', error);
        }
        originalToggleMute();
      }
    });
    
    return () => {
      useCallStore.setState({
        acceptCall: originalAcceptCall,
        rejectCall: originalRejectCall,
        endCall: originalEndCall,
        toggleMute: originalToggleMute
      });
    };
  }, [twilioAnswerCall, twilioRejectCall, twilioEndCall, twilioToggleMute]);

  // Handle Twilio errors
  useEffect(() => {
    if (twilioError) {
      toast.error(`Call error: ${twilioError}`);
    }
  }, [twilioError]);
}
