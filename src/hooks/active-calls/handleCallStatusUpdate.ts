
import { toast } from "sonner";
import { ActiveCall } from "../use-active-calls";

export function handleCallStatusUpdate(
  call: ActiveCall,
  isIncoming: boolean,
  setIncomingCall: (call: ActiveCall | null) => void,
  setOutgoingCall: (call: ActiveCall | null) => void
) {
  if (call.status === 'rejected') {
    if (isIncoming) {
      setIncomingCall(null);
    } else {
      setOutgoingCall(null);
      toast.error("Call was rejected");
    }
  } else if (call.status === 'ended') {
    if (isIncoming) {
      setIncomingCall(null);
    } else {
      setOutgoingCall(null);
    }
  } else if (call.status === 'accepted') {
    if (isIncoming) {
      setIncomingCall(call);
    } else {
      setOutgoingCall(call);
    }
  } else if (call.status === 'pending') {
    if (!isIncoming) {
      setOutgoingCall(call);
    }
  }
}
