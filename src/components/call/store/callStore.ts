
import { create } from 'zustand';
import { CallStatus } from '@/components/call/useTwilioVoice';

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
  },
  
  rejectCall: () => {
    set({ showIncomingCall: false });
    setTimeout(() => get().resetCallState(), 500);
  },
  
  endCall: () => {
    set({ showActiveCall: false });
    setTimeout(() => get().resetCallState(), 500);
  },
  
  toggleMute: () => {
    set({ isMuted: !get().isMuted });
  },
  
  updateCallStatus: (status) => {
    set({ callStatus: status });
    if (status === CallStatus.COMPLETED || 
        status === CallStatus.FAILED || 
        status === CallStatus.CANCELED) {
      set({ showActiveCall: false, showIncomingCall: false });
      setTimeout(() => get().resetCallState(), 1000);
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
