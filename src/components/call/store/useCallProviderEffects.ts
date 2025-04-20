
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
  // Handle call initiation with debouncing
  useEffect(() => {
    let callInitTimeout: number | null = null;
    
    if (callStatus === CallStatus.CONNECTING && 
        recipientId && 
        isReady && 
        showActiveCall) {
      
      // Small delay to ensure the UI has time to update
      callInitTimeout = window.setTimeout(() => {
        try {
          console.log(`Initiating call to ${recipientId}`);
          twilioStartCall(recipientId);
        } catch (error) {
          console.error('Error starting call:', error);
          toast.error(`Failed to start call: ${error.message}`);
          updateCallStatus(CallStatus.FAILED);
        }
      }, 500);
    }
    
    return () => {
      if (callInitTimeout) {
        window.clearTimeout(callInitTimeout);
      }
    };
  }, [callStatus, recipientId, isReady, showActiveCall, twilioStartCall, updateCallStatus]);

  // Handle call status changes
  useEffect(() => {
    if (twilioCallStatus !== callStatus) {
      console.log(`Call status changed: ${callStatus} -> ${twilioCallStatus}`);
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
      console.log(`Incoming call from ${remoteParticipant}`);
      useCallStore.getState().receiveCall(remoteParticipant);
    }
  }, [twilioCallStatus, remoteParticipant, showIncomingCall]);

  // Handle call actions - THIS IS THE PROBLEMATIC PART
  useEffect(() => {
    // Get the original function references
    const callStore = useCallStore.getState();
    const originalAcceptCall = callStore.acceptCall;
    const originalRejectCall = callStore.rejectCall;
    const originalEndCall = callStore.endCall;
    const originalToggleMute = callStore.toggleMute;
    
    // Create a local variable to track if we've already set the handlers
    const handlers = {
      acceptCall: () => {
        try {
          console.log('Accepting call');
          twilioAnswerCall();
        } catch (error) {
          console.error('Error in acceptCall:', error);
        }
        originalAcceptCall();
      },
      rejectCall: () => {
        try {
          console.log('Rejecting call');
          twilioRejectCall();
        } catch (error) {
          console.error('Error in rejectCall:', error);
        }
        originalRejectCall();
      },
      endCall: () => {
        try {
          console.log('Ending call');
          twilioEndCall();
        } catch (error) {
          console.error('Error in endCall:', error);
        }
        originalEndCall();
      },
      toggleMute: () => {
        try {
          console.log('Toggling mute');
          twilioToggleMute();
        } catch (error) {
          console.error('Error in toggleMute:', error);
        }
        originalToggleMute();
      }
    };
    
    // Update the store with our handlers
    useCallStore.setState(handlers);
    
    // Cleanup function
    return () => {
      // Restore original functions only if the current ones match our handlers
      // This prevents overwriting handlers set by other components
      const currentState = useCallStore.getState();
      if (currentState.acceptCall === handlers.acceptCall) {
        useCallStore.setState({
          acceptCall: originalAcceptCall,
        });
      }
      if (currentState.rejectCall === handlers.rejectCall) {
        useCallStore.setState({
          rejectCall: originalRejectCall,
        });
      }
      if (currentState.endCall === handlers.endCall) {
        useCallStore.setState({
          endCall: originalEndCall,
        });
      }
      if (currentState.toggleMute === handlers.toggleMute) {
        useCallStore.setState({
          toggleMute: originalToggleMute,
        });
      }
    };
  }, [twilioAnswerCall, twilioRejectCall, twilioEndCall, twilioToggleMute]);

  // Handle Twilio errors
  useEffect(() => {
    if (twilioError) {
      console.error('Twilio error:', twilioError);
      toast.error(`Call error: ${twilioError}`);
    }
  }, [twilioError]);
}
