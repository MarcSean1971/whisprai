import { create } from 'zustand';
import { toast } from 'sonner';
import { CallStatus, useTwilioVoice } from '@/components/call/useTwilioVoice';
import { useEffect } from 'react';

interface CallState {
  // Call data
  callStatus: CallStatus;
  callerId: string | null;
  callerName: string | null;
  recipientId: string | null;
  recipientName: string | null;
  error: string | null;
  isMuted: boolean;
  callDuration: number;
  
  // UI state
  showIncomingCall: boolean;
  showActiveCall: boolean;
  
  // Actions
  initiateCall: (recipientId: string, recipientName?: string) => void;
  receiveCall: (callerId: string, callerName?: string) => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  updateCallStatus: (status: CallStatus) => void;
  updateCallDuration: (duration: number) => void;
  resetCallState: () => void;
}

export const useCallStore = create<CallState>((set, get) => ({
  // Call data
  callStatus: CallStatus.IDLE,
  callerId: null,
  callerName: null,
  recipientId: null,
  recipientName: null,
  error: null,
  isMuted: false,
  callDuration: 0,
  
  // UI state
  showIncomingCall: false,
  showActiveCall: false,
  
  // Actions
  initiateCall: (recipientId, recipientName) => {
    set({ 
      callStatus: CallStatus.CONNECTING,
      recipientId,
      recipientName: recipientName || recipientId,
      showActiveCall: true
    });
    
    // The actual Twilio call initiation will be handled by the CallProvider
  },
  
  receiveCall: (callerId, callerName) => {
    set({ 
      callStatus: CallStatus.RINGING,
      callerId,
      callerName: callerName || callerId,
      showIncomingCall: true
    });
  },
  
  acceptCall: () => {
    set({ 
      callStatus: CallStatus.IN_PROGRESS,
      showIncomingCall: false,
      showActiveCall: true
    });
    
    // The actual call acceptance will be handled by the CallProvider
  },
  
  rejectCall: () => {
    set({ 
      showIncomingCall: false
    });
    
    // After a short delay, reset the state entirely
    setTimeout(() => {
      get().resetCallState();
    }, 500);
    
    // The actual call rejection will be handled by the CallProvider
  },
  
  endCall: () => {
    set({ 
      showActiveCall: false
    });
    
    // After a short delay, reset the state entirely
    setTimeout(() => {
      get().resetCallState();
    }, 500);
    
    // The actual call ending will be handled by the CallProvider
  },
  
  toggleMute: () => {
    set({ isMuted: !get().isMuted });
    
    // The actual muting will be handled by the CallProvider
  },
  
  updateCallStatus: (status) => {
    set({ callStatus: status });
    
    // Update UI state based on call status
    if (status === CallStatus.COMPLETED || 
        status === CallStatus.FAILED || 
        status === CallStatus.CANCELED) {
      set({ showActiveCall: false, showIncomingCall: false });
      
      // After a short delay, reset the state entirely
      setTimeout(() => {
        get().resetCallState();
      }, 1000);
    }
  },
  
  updateCallDuration: (duration) => {
    set({ callDuration: duration });
  },
  
  resetCallState: () => {
    set({
      callStatus: CallStatus.IDLE,
      callerId: null,
      callerName: null,
      recipientId: null,
      recipientName: null,
      error: null,
      isMuted: false,
      callDuration: 0,
      showIncomingCall: false,
      showActiveCall: false
    });
  }
}));

// Component to connect the store to the Twilio voice functionality
export function CallProvider({ userId, children }: { userId: string, children: React.ReactNode }) {
  const { 
    isReady,
    callStatus: twilioCallStatus,
    error: twilioError,
    isMuted: twilioIsMuted,
    remoteParticipant,
    startCall: twilioStartCall,
    answerCall: twilioAnswerCall,
    endCall: twilioEndCall,
    rejectCall: twilioRejectCall,
    toggleMute: twilioToggleMute
  } = useTwilioVoice({ userId });
  
  const {
    callStatus,
    recipientId,
    updateCallStatus,
    showActiveCall,
    showIncomingCall
  } = useCallStore();
  
  // Handle store-initiated calls
  useEffect(() => {
    // Attempt to start the call when the store state changes to CONNECTING
    if (callStatus === CallStatus.CONNECTING && 
        recipientId && 
        isReady && 
        showActiveCall) {
      twilioStartCall(recipientId);
    }
  }, [callStatus, recipientId, isReady, showActiveCall, twilioStartCall]);
  
  // Keep the store in sync with Twilio's call status
  useEffect(() => {
    if (twilioCallStatus !== callStatus) {
      updateCallStatus(twilioCallStatus);
      
      // Show appropriate toast notifications for status changes
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
  
  // Handle Twilio incoming calls
  useEffect(() => {
    if (twilioCallStatus === CallStatus.RINGING && remoteParticipant && !showIncomingCall) {
      // Update the store with incoming call information
      useCallStore.getState().receiveCall(remoteParticipant);
    }
  }, [twilioCallStatus, remoteParticipant, showIncomingCall]);
  
  // Wire up the store actions to Twilio functions
  useEffect(() => {
    // Override the store actions with the actual Twilio implementations
    const originalAcceptCall = useCallStore.getState().acceptCall;
    const originalRejectCall = useCallStore.getState().rejectCall;
    const originalEndCall = useCallStore.getState().endCall;
    const originalToggleMute = useCallStore.getState().toggleMute;
    
    useCallStore.setState({
      acceptCall: () => {
        twilioAnswerCall();
        originalAcceptCall();
      },
      rejectCall: () => {
        twilioRejectCall();
        originalRejectCall();
      },
      endCall: () => {
        twilioEndCall();
        originalEndCall();
      },
      toggleMute: () => {
        twilioToggleMute();
        originalToggleMute();
      }
    });
    
    // Restore original functions on cleanup
    return () => {
      useCallStore.setState({
        acceptCall: originalAcceptCall,
        rejectCall: originalRejectCall,
        endCall: originalEndCall,
        toggleMute: originalToggleMute
      });
    };
  }, [twilioAnswerCall, twilioRejectCall, twilioEndCall, twilioToggleMute]);
  
  // Handle errors
  useEffect(() => {
    if (twilioError) {
      toast.error(`Call error: ${twilioError}`);
    }
  }, [twilioError]);
  
  return <>{children}</>;
}
