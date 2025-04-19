
export enum CallStatus {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  RINGING = 'ringing',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  BUSY = 'busy',
  FAILED = 'failed',
  CANCELED = 'canceled',
  NO_ANSWER = 'no-answer'
}

export interface UseTwilioVoiceProps {
  userId: string;
}

export interface TwilioVoiceState {
  device: any | null;
  activeCall: any | null;
  isReady: boolean;
  callStatus: CallStatus;
  error: string | null;
  isMuted: boolean;
  remoteParticipant: string | null;
}
