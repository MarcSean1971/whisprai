
export interface ConnectionDetails {
  connectionState: string | null;
  iceConnectionState: string | null;
  iceGatheringState: string | null;
  signalingState: string | null;
  iceCandidates: number;
  lastActivity: number;
}
