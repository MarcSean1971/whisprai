import { useEffect, useRef } from 'react';
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
  // Keep track of whether handlers have been registered
  const handlersRegistered = useRef(false);
  
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

  // Register call handlers once on component mount
  useEffect(() => {
    // Only run this once to avoid infinite loops
    if (!handlersRegistered.current) {
      console.log('Registering call handlers');
      
      // Store original handlers for reference
      const callStore = useCallStore.getState();
      const origAcceptCall = callStore.acceptCall;
      const origRejectCall = callStore.rejectCall;
      const origEndCall = callStore.endCall;
      const origToggleMute = callStore.toggleMute;
      
      // Create wrapper functions that call both Twilio and the original handlers
      const wrapTwilioAction = (twilio: () => void, original: () => void) => {
        return () => {
          try {
            twilio();
          } catch (err) {
            console.error('Twilio action error:', err);
          }
          // Always execute the original handler to maintain UI state
          original();
        };
      };
      
      // Update the store with wrapped handlers
      useCallStore.setState({
        acceptCall: wrapTwilioAction(twilioAnswerCall, origAcceptCall),
        rejectCall: wrapTwilioAction(twilioRejectCall, origRejectCall),
        endCall: wrapTwilioAction(twilioEndCall, origEndCall),
        toggleMute: wrapTwilioAction(twilioToggleMute, origToggleMute)
      });
      
      // Mark handlers as registered
      handlersRegistered.current = true;
      
      // Cleanup function to restore original handlers on unmount
      return () => {
        console.log('Restoring original call handlers');
        useCallStore.setState({
          acceptCall: origAcceptCall,
          rejectCall: origRejectCall,
          endCall: origEndCall,
          toggleMute: origToggleMute
        });
      };
    }
  }, [twilioAnswerCall, twilioRejectCall, twilioEndCall, twilioToggleMute]);

  // Handle Twilio errors
  useEffect(() => {
    if (twilioError) {
      console.error('Twilio error:', twilioError);
      toast.error(`Call error: ${twilioError}`);
    }
  }, [twilioError]);
}
