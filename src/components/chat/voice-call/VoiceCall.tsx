
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { PhoneCall, PhoneOff } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"

interface VoiceCallProps {
  recipientId: string;
  onError: (error: Error) => void;
}

declare global {
  interface Window {
    Vonage: any;
  }
}

export function VoiceCall({ 
  recipientId,
  onError 
}: VoiceCallProps) {
  const [isCallActive, setIsCallActive] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const ringtoneRef = useRef<HTMLAudioElement>(null)
  const clientRef = useRef<any>(null)
  const sessionRef = useRef<any>(null)

  useEffect(() => {
    // Load Vonage Client SDK script
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/@vonage/client-sdk@1.3.0/dist/vonageClient.min.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
      if (sessionRef.current) {
        sessionRef.current.disconnect()
      }
      if (ringtoneRef.current) {
        ringtoneRef.current.pause()
      }
    }
  }, [])

  const initializeCall = async () => {
    try {
      setIsConnecting(true)
      
      const { data: sessionResponse, error: sessionError } = await supabase.functions.invoke(
        'vonage-session',
        {
          body: { recipientId }
        }
      )

      if (sessionError) throw new Error(sessionError.message)
      
      const { token, applicationId } = sessionResponse
      
      if (!token || !applicationId) {
        throw new Error('Failed to get Vonage credentials')
      }

      // Initialize Vonage client
      clientRef.current = new window.Vonage(applicationId, {
        debug: true
      })

      // Login with the JWT token
      await clientRef.current.login(token)

      // Create a session
      sessionRef.current = await clientRef.current.createSession()

      // Enable audio
      await sessionRef.current.enableAudio()

      // Start playing ringtone
      if (ringtoneRef.current) {
        ringtoneRef.current.play().catch(console.error)
      }

      // Call the recipient
      await sessionRef.current.callUser(recipientId)
      
      setIsCallActive(true)
      toast.success('Call connected')
      
    } catch (error) {
      console.error('Error starting call:', error)
      if (ringtoneRef.current) {
        ringtoneRef.current.pause()
      }
      onError(error instanceof Error ? error : new Error('Failed to start call'))
    } finally {
      setIsConnecting(false)
    }
  }

  const endCall = async () => {
    try {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause()
      }

      if (sessionRef.current) {
        await sessionRef.current.hangup()
        sessionRef.current = null
      }
      
      toast.success('Call ended')
    } catch (error) {
      console.error('Error ending call:', error)
    } finally {
      setIsCallActive(false)
    }
  }

  return (
    <div className="space-y-4">
      <audio ref={ringtoneRef} src="/sounds/ringtone.mp3" loop />
      
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
            <PhoneOff className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            variant="default"
            size="icon"
            onClick={initializeCall}
            disabled={isConnecting}
          >
            <PhoneCall className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  )
}
