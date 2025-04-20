
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { VoiceCall } from "./VoiceCall"
import { toast } from "sonner"

interface VoiceCallDialogProps {
  isOpen: boolean
  onClose: () => void
  recipientId: string
  recipientName: string
}

export function VoiceCallDialog({
  isOpen,
  onClose,
  recipientId,
  recipientName
}: VoiceCallDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Call with {recipientName}</DialogTitle>
        </DialogHeader>
        <VoiceCall 
          recipientId={recipientId}
          onError={(err) => {
            toast.error(err.message)
            onClose()
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
