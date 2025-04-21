
export interface IceConnectionStats {
  connectionState: RTCPeerConnectionState | null;
  iceConnectionState: RTCIceConnectionState | null;
  iceGatheringState: RTCIceGatheringState | null;
  signalingState: RTCSignalingState | null;
  iceCandidates: number;
  lastActivity: number;
}

export interface IceCandidateSignal {
  candidate: string;
  sdpMLineIndex?: number;
  sdpMid?: string;
}

export function isIceCandidateSignal(signal: any): signal is IceCandidateSignal {
  return signal && 'candidate' in signal;
}
