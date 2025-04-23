
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onCancel: () => void;
  loading: boolean;
  recipientName?: string;
}

export function VideoCallOutgoingDialog({
  open, onCancel, loading, recipientName
}: Props) {
  return (
    <Dialog open={open}>
      <DialogContent className="max-w-xs flex flex-col gap-2 items-center text-center p-5">
        <div className="font-medium text-lg mb-2">Calling...</div>
        <div>
          {recipientName
            ? <>Waiting for <b>{recipientName}</b> to answer.</>
            : "Waiting for recipient to answer."}
        </div>
        <Button
          onClick={onCancel}
          disabled={loading}
          variant="destructive"
          className="w-full mt-4"
        >
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
}
