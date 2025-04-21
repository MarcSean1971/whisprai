
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
}
