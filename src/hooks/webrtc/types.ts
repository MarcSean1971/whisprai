
export interface WebRTCPeerOptions {
  initiator: boolean;
  onSignal: (data: any) => void;
  remoteSignal?: any;
}

export type ConnectionStatus = 
  | "idle"
  | "calling"
  | "incoming"
  | "connecting"
  | "connected"
  | "ended"
  | "missed"
  | "rejected"
  | "error";

export interface UseWebRTCPeerReturn {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isAudioMuted: boolean;
  toggleAudio: () => void;
  isVideoMuted: boolean;
  toggleVideo: () => void;
  endCall: () => void;
  isConnecting: boolean;
  callStatus: ConnectionStatus;
  isScreenSharing: boolean;
  toggleScreenShare: () => Promise<void>;
  callDuration: number;
  connectionDetails?: any;
}

export interface CallSession {
  id: string;
  caller_id: string;
  recipient_id: string;
  conversation_id: string;
  status: string;
  call_type: string;
  signaling_data: any | null;
  created_at: string;
  updated_at: string;
}

export interface UseCallSessionReturn {
  isCalling: boolean;
  callSession: CallSession | null;
  incomingCall: CallSession | null;
  status: string | null;
  signaling: any;
  setSignaling: (data: any) => void;
  remoteSignal: any;
  callHistory: CallSession[];
}

export interface UseCallActionsReturn {
  startCall: (callType?: "audio" | "video") => Promise<CallSession | null>;
  acceptCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  endCall: (sessionId?: string, endStatus?: 'ended' | 'missed') => Promise<void>;
  updateSignalingData: (sessionId: string, signalingObj: any) => Promise<void>;
}
