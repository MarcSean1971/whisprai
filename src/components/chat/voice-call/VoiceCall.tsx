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

    script.onerror = () => {
      console.error('Failed to load Vonage Client SDK')
      onError(new Error('Failed to load voice call service'))
    }

    return () => {
      document.body.removeChild(script)
      handleCleanup()
    }
  }, [onError])

  const handleCleanup = async () => {
    try {
      if (sessionRef.current) {
        await sessionRef.current.leave()
        sessionRef.current = null
      }
      if (clientRef.current) {
        await clientRef.current.disconnect()
        clientRef.current = null
      }
      if (ringtoneRef.current) {
        ringtoneRef.current.pause()
      }
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  }

  const initializeCall = async () => {
    try {
      setIsConnecting(true)
      console.log('Initializing call...')

      const { data: sessionResponse, error: sessionError } = await supabase.functions.invoke(
        'vonage-session',
        {
          body: { recipientId }
        }
      )

      if (sessionError) {
        console.error('Session error:', sessionError)
        throw new Error('Failed to initialize call')
      }
      
      const { token, applicationId } = sessionResponse
      
      if (!token || !applicationId) {
        throw new Error('Failed to get voice call credentials')
      }

      console.log('Got Vonage credentials, initializing client...')

      // Initialize Vonage client
      if (!window.Vonage) {
        throw new Error('Voice call service not loaded')
      }

      clientRef.current = new window.Vonage.Client({
        debug: true
      })

      // Set up event handlers
      clientRef.current.on('error', (error: any) => {
        console.error('Vonage client error:', error)
        onError(new Error(error.message || 'Call failed'))
        handleCleanup()
      })

      clientRef.current.on('disconnected', () => {
        console.log('Disconnected from voice service')
        setIsCallActive(false)
      })

      // Create session with the generated token
      await clientRef.current.createSession(token)
      console.log('Session created successfully')

      // Create a conversation and join it
      sessionRef.current = await clientRef.current.session.create({
        name: `call-${Date.now()}`,
        display_name: `Call with ${recipientId}`
      })

      // Enable audio
      await sessionRef.current.media.enable({
        audio: true,
        video: false
      })

      console.log('Audio enabled, inviting recipient...')

      // Invite the recipient
      await sessionRef.current.invite(recipientId)

      // Start playing ringtone
      if (ringtoneRef.current) {
        ringtoneRef.current.play().catch(console.error)
      }
      
      setIsCallActive(true)
      toast.success('Call connected')
      
    } catch (error) {
      console.error('Error starting call:', error)
      if (ringtoneRef.current) {
        ringtoneRef.current.pause()
      }
      onError(error instanceof Error ? error : new Error('Failed to start call'))
      handleCleanup()
    } finally {
      setIsConnecting(false)
    }
  }

  const endCall = async () => {
    try {
      await handleCleanup()
      toast.success('Call ended')
    } catch (error) {
      console.error('Error ending call:', error)
      onError(error instanceof Error ? error : new Error('Failed to end call'))
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
