
import { useState } from 'react';
import { Device } from 'twilio-client';
import { CallStatus, TwilioVoiceState } from '../types';

export function useDeviceState() {
  const [state, setState] = useState<TwilioVoiceState>({
    device: null,
    activeCall: null,
    isReady: false,
    callStatus: CallStatus.IDLE,
    error: null,
    isMuted: false,
    remoteParticipant: null
  });

  const updateState = (updates: Partial<TwilioVoiceState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const updateDevice = (device: Device | null) => {
    updateState({ device, isReady: !!device });
  };

  const updateCallStatus = (status: CallStatus) => {
    updateState({ callStatus: status });
  };

  const resetState = () => {
    setState({
      device: null,
      activeCall: null,
      isReady: false,
      callStatus: CallStatus.IDLE,
      error: null,
      isMuted: false,
      remoteParticipant: null
    });
  };

  return {
    state,
    updateState,
    updateDevice,
    updateCallStatus,
    resetState
  };
}
