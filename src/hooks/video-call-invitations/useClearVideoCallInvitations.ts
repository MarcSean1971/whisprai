
import { useCallback } from "react";

export function useClearVideoCallInvitations(
  setInvitation: (val: null) => void,
  setOutgoingInvitation: (val: null) => void
) {
  // Clear both incoming and outgoing invites
  return useCallback(() => {
    setInvitation(null);
    setOutgoingInvitation(null);
  }, [setInvitation, setOutgoingInvitation]);
}
