
import { IncomingCallDialog } from "@/components/call/IncomingCallDialog";
import { ActiveCallDialog } from "@/components/call/ActiveCallDialog";
import { CallProvider } from "@/components/call/store/useCallStore";

interface CallInterfaceProps {
  userId: string;
}

export function CallInterface({ userId }: CallInterfaceProps) {
  return (
    <CallProvider userId={userId}>
      <IncomingCallDialog />
      <ActiveCallDialog />
    </CallProvider>
  );
}
