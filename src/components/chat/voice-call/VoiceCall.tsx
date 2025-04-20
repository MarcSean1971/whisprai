
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { PhoneCall, PhoneOff } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"

interface VoiceCallProps {
  sessionId: string
  ncco: any[]
  recipientId: string
  onError: (error: Error) => void
}

export function VoiceCall({ 
  sessionId, 
  ncco, 
  recipientId, 
  onError 
}: VoiceCallProps) {
  const [isCallActive, setIsCallActive] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const callId = useRef<string | null>(null)
  
  useEffect(() => {
    return () => {
      if (callId.current) {
        endCall().catch(console.error)
      }
    }
  }, [])

  const startCall = async () => {
    try {
      setIsConnecting(true)
      
      // Get token for the current user
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('User not authenticated')

      const { data: tokenResponse, error: tokenError } = await supabase.functions.invoke(
        'vonage-token',
        {
          body: { 
            sessionId,
            userId: userData.user.id
          }
        }
      )

      if (tokenError) throw new Error(tokenError.message)
      
      // Create a voice call
      const { data: callResponse, error: callError } = await supabase.functions.invoke(
        'vonage-create-call',
        {
          body: { 
            sessionId,
            recipientId,
            ncco
          }
        }
      )

      if (callError) throw new Error(callError.message)
      
      callId.current = callResponse.callId
      setIsCallActive(true)
      toast.success('Call connected')
      
    } catch (error) {
      console.error('Error starting call:', error)
      onError(error instanceof Error ? error : new Error('Failed to start call'))
    } finally {
      setIsConnecting(false)
    }
  }

  const endCall = async () => {
    if (!callId.current) return
    
    try {
      const { error } = await supabase.functions.invoke(
        'vonage-end-call',
        {
          body: { 
            callId: callId.current 
          }
        }
      )

      if (error) throw new Error(error.message)
      
      toast.success('Call ended')
    } catch (error) {
      console.error('Error ending call:', error)
    } finally {
      setIsCallActive(false)
      callId.current = null
    }
  }

  return (
    <div className="space-y-4">
      <div className="w-full h-64 bg-secondary rounded-lg flex items-center justify-center">
        {isCallActive ? (
          <div className="text-center">
            <div className="text-xl font-medium mb-2">Call in progress</div>
            <div className="text-muted-foreground">Connected to voice call</div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-xl font-medium mb-2">Ready to connect</div>
            <div className="text-muted-foreground">Press the call button to start</div>
          </div>
        )}
      </div>
      
      <div className="flex justify-center gap-2">
        {isCallActive ? (
          <Button
            variant="destructive"
            size="icon"
            onClick={endCall}
          >
            <PhoneOff />
          </Button>
        ) : (
          <Button
            variant="default"
            size="icon"
            onClick={startCall}
            disabled={isConnecting}
          >
            <PhoneCall />
          </Button>
        )}
      </div>
    </div>
  )
}
