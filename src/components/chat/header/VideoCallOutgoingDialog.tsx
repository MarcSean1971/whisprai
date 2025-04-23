
import { Button } from "@/components/ui/button";

/** Minimal banner for "Calling..." */
interface Props {
  open: boolean;
  onCancel: () => void;
  loading: boolean;
  recipientName?: string;
}
export function VideoCallOutgoingDialog({
  open, onCancel, loading, recipientName
}: Props) {
  if (!open) return null;
  return (
    <div className="fixed top-16 left-0 right-0 mx-auto z-[100] max-w-xs bg-primary text-primary-foreground rounded-md px-4 py-4 text-center ring-2 ring-primary shadow-lg">
      <div className="font-medium text-lg">Calling...</div>
      <div className="mb-4">
        {recipientName
          ? <>Waiting for <b>{recipientName}</b> to answer.</>
          : "Waiting for recipient to answer."}
      </div>
      <Button
        onClick={onCancel}
        disabled={loading}
        variant="destructive"
        className="w-full"
      >
        Cancel
      </Button>
    </div>
  );
}
