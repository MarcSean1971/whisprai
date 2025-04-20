
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useEffect, useState } from "react"
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
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      initializeCall()
    }
  }, [isOpen])

  const initializeCall = async () => {
    try {
      const { data: sessionResponse, error: sessionError } = await supabase.functions.invoke(
        'vonage-session',
        {
          body: { recipientId }
        }
      )

      if (sessionError) throw new Error(sessionError.message)
      setSessionId(sessionResponse.sessionId)
    } catch (err) {
      console.error('Failed to initialize call:', err)
      setError(err.message)
      toast.error('Failed to initialize call')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Call with {recipientName}</DialogTitle>
        </DialogHeader>
        {sessionId && (
          <VoiceCall 
            sessionId={sessionId}
            recipientId={recipientId}
            onError={(err) => {
              setError(err.message)
              toast.error(err.message)
              onClose()
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
