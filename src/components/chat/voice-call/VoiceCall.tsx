
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX, PhoneOff } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"

interface VoiceCallProps {
  sessionId: string
  recipientId: string
  onError: (error: Error) => void
}

export function VoiceCall({ sessionId, recipientId, onError }: VoiceCallProps) {
  const [isMuted, setIsMuted] = useState(false)
  const vonageSession = useRef<any>(null)
  const publisher = useRef<any>(null)

  useEffect(() => {
    initializeVonage()
    return () => {
      if (publisher.current) {
        publisher.current.destroy()
      }
      if (vonageSession.current) {
        vonageSession.current.disconnect()
      }
    }
  }, [])

  const initializeVonage = async () => {
    try {
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

      // Initialize Vonage session
      vonageSession.current = VonageVideo.initSession(sessionId)
      
      vonageSession.current.connect(tokenResponse.token, (error: Error) => {
        if (error) {
          onError(error)
          return
        }

        // Create publisher
        publisher.current = VonageVideo.initPublisher('publisher', {
          insertMode: 'append',
          width: '100%',
          height: '100%'
        })

        vonageSession.current.publish(publisher.current)
      })

    } catch (error) {
      console.error('Error initializing Vonage:', error)
      onError(error)
    }
  }

  const handleMuteToggle = () => {
    if (publisher.current) {
      publisher.current.publishAudio(!isMuted)
      setIsMuted(!isMuted)
    }
  }

  const handleEndCall = () => {
    if (publisher.current) {
      publisher.current.destroy()
    }
    if (vonageSession.current) {
      vonageSession.current.disconnect()
    }
    toast.success('Call ended')
  }

  return (
    <div className="space-y-4">
      <div id="publisher" className="w-full h-64 bg-secondary rounded-lg"></div>
      
      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleMuteToggle}
        >
          {isMuted ? <VolumeX /> : <Volume2 />}
        </Button>
        
        <Button
          variant="destructive"
          size="icon"
          onClick={handleEndCall}
        >
          <PhoneOff />
        </Button>
      </div>
    </div>
  )
}
