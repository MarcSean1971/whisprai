
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
  const scriptLoadingRef = useRef<boolean>(false)
  const scriptLoadedRef = useRef<boolean>(false)

  useEffect(() => {
    // Wait a moment before loading to ensure DOM is fully ready
    const initTimer = setTimeout(() => {
      loadVonageSDK().catch((error) => {
        console.error('Initial script loading failed:', error)
        onError(error)
      })
    }, 1000)

    return () => {
      clearTimeout(initTimer)
      handleCleanup()
    }
  }, [onError])

  const loadVonageSDK = async (retryCount = 0): Promise<void> => {
    if (scriptLoadingRef.current) {
      console.log('Script already loading, skipping duplicate load')
      return
    }

    if (scriptLoadedRef.current && window.Vonage) {
      console.log('Script already loaded, skipping load')
      return
    }

    scriptLoadingRef.current = true
    console.log('Loading Vonage Client SDK...')

    return new Promise((resolve, reject) => {
      // First remove any existing scripts to avoid conflicts
      const existingScripts = document.querySelectorAll('script[src*="vonage"]')
      existingScripts.forEach(script => script.remove())

      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/@vonage/client-sdk@1.3.0/dist/vonageClientSDK.min.js'
      script.async = true

      const timeoutId = setTimeout(() => {
        scriptLoadingRef.current = false
        script.remove()
        reject(new Error('Script loading timed out'))
      }, 15000)  // 15 second timeout

      script.onload = () => {
        clearTimeout(timeoutId)
        console.log('Vonage Client SDK loaded successfully')
        scriptLoadingRef.current = false
        scriptLoadedRef.current = true
        
        if (!window.Vonage) {
          console.error('Vonage SDK loaded but global object not available')
          reject(new Error('Vonage SDK not properly initialized'))
          return
        }
        
        resolve()
      }

      script.onerror = () => {
        clearTimeout(timeoutId)
        console.error(`Failed to load Vonage Client SDK (attempt ${retryCount + 1})`)
        script.remove()
        scriptLoadingRef.current = false
        
        if (retryCount < 3) {
          console.log('Retrying script load...')
          setTimeout(() => {
            loadVonageSDK(retryCount + 1).then(resolve).catch(reject)
          }, 2000)
        } else {
          reject(new Error('Failed to load voice call service after multiple attempts'))
        }
      }

      document.body.appendChild(script)
    })
  }

  const handleCleanup = async () => {
    try {
      if (sessionRef.current) {
        console.log('Cleaning up session...')
        try {
          await sessionRef.current.leave()
        } catch (error) {
          console.error('Error leaving session:', error)
        }
        sessionRef.current = null
      }
      
      if (clientRef.current) {
        console.log('Disconnecting client...')
        try {
          await clientRef.current.disconnect()
        } catch (error) {
          console.error('Error disconnecting client:', error)
        }
        clientRef.current = null
      }
      
      if (ringtoneRef.current) {
        ringtoneRef.current.pause()
        ringtoneRef.current.currentTime = 0
      }
      
      setIsCallActive(false)
      setIsConnecting(false)
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  }

  const initializeCall = async () => {
    try {
      setIsConnecting(true)
      console.log('Initializing call...')

      // If SDK is not loaded yet, try loading it again
      if (typeof window.Vonage === 'undefined') {
        console.log('Vonage not loaded, attempting to load SDK again')
        await loadVonageSDK()
        
        // Double-check it's available after loading
        if (typeof window.Vonage === 'undefined') {
          throw new Error('Voice call service not initialized. Please try again in a moment.')
        }
      }

      console.log('Getting Vonage session token...')
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

      console.log('Got Vonage credentials, initializing RTC client...')

      clientRef.current = new window.Vonage.Client({
        debug: true,
        autoConnect: false
      })

      clientRef.current.on('error', (error: any) => {
        console.error('Vonage client error:', error)
        onError(new Error(error.message || 'Call failed'))
        handleCleanup()
      })

      clientRef.current.on('disconnected', () => {
        console.log('Disconnected from voice service')
        handleCleanup()
      })

      console.log('Creating session with token...')
      await clientRef.current.createSession(token)
      console.log('Session created successfully')

      console.log('Creating call conversation...')
      sessionRef.current = await clientRef.current.session.create({
        name: `call-${Date.now()}`,
        display_name: `Call with ${recipientId}`
      })

      console.log('Enabling audio...')
      await sessionRef.current.media.enable({
        audio: true,
        video: false
      })

      console.log('Audio enabled, inviting recipient...')
      await sessionRef.current.invite(recipientId)

      if (ringtoneRef.current) {
        await ringtoneRef.current.play().catch(console.error)
      }
      
      setIsCallActive(true)
      toast.success('Call connected')
      
    } catch (error) {
      console.error('Error starting call:', error)
      if (ringtoneRef.current) {
        ringtoneRef.current.pause()
        ringtoneRef.current.currentTime = 0
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
