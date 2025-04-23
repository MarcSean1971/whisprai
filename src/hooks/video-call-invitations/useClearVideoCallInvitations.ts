
import { useCallback } from "react";
import type { SetterOrUpdater } from "recoil"; // Not used, just type reminder.

export function useClearVideoCallInvitations(
  setInvitation: (val: any) => void,
  setOutgoingInvitation: (val: any) => void
) {
  // Clear both incoming and outgoing invites
  return useCallback(() => {
    setInvitation(null);
    setOutgoingInvitation(null);
  }, [setInvitation, setOutgoingInvitation]);
}
