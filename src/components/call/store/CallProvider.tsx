
import { useTwilioVoice } from '@/components/call/useTwilioVoice';
import { useCallStore } from './callStore';
import { useCallProviderEffects } from './useCallProviderEffects';

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
  
  useCallProviderEffects({
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
  });

  return <>{children}</>;
}
