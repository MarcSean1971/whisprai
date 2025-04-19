
import { Device } from 'twilio-client';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useDeviceSetup() {
  const setupPolyfills = () => {
    if (typeof window !== 'undefined') {
      // Create a proper EventEmitter implementation
      class EventEmitter {
        // Properly define the events property with its type
        private events: Record<string, Function[]> = {};
        
        on(event: string, listener: Function) {
          if (!this.events[event]) {
            this.events[event] = [];
          }
          this.events[event].push(listener);
          return this;
        }
        
        removeListener(event: string, listener: Function) {
          if (!this.events[event]) return this;
          this.events[event] = this.events[event].filter(l => l !== listener);
          return this;
        }
        
        emit(event: string, ...args: any[]) {
          if (!this.events[event]) return false;
          this.events[event].forEach(listener => listener(...args));
          return true;
        }
      }
      
      // Ensure EventEmitter is available globally to Twilio
      if (!(window as any).EventEmitter) {
        (window as any).EventEmitter = EventEmitter;
      }
      
      // Also define it as a module export for inheritance
      if (!(window as any).events) {
        (window as any).events = {
          EventEmitter: EventEmitter
        };
      }
      
      // Create proper inheritance structure for EventEmitter
      Object.setPrototypeOf(EventEmitter.prototype, Object.prototype);
      
      // Add window.global for browser environment
      if (!window.global) {
        window.global = window;
      }
      
      // Add process object for browser environment
      if (!(window as any).process) {
        (window as any).process = { 
          nextTick: (fn: Function) => setTimeout(fn, 0),
          env: {},
          version: '',
          versions: {},
          platform: 'browser'
        };
      }
    }
  };

  const initializeDevice = async (userId: string): Promise<Device> => {
    const { data, error: tokenError } = await supabase.functions.invoke('twilio-token', {
      body: { identity: userId }
    });

    if (tokenError || !data?.token) {
      throw new Error(tokenError?.message || 'Failed to get access token');
    }

    const device = new Device();
    await device.setup(data.token, {
      debug: true,
      allowIncomingWhileBusy: true,
      codecPreferences: ['opus', 'pcmu'] as any
    });

    return device;
  };

  return {
    setupPolyfills,
    initializeDevice
  };
}
