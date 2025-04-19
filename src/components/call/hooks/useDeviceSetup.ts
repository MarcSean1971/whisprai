
import { Device } from 'twilio-client';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useDeviceSetup() {
  const setupPolyfills = () => {
    if (typeof window !== 'undefined') {
      // Make sure the EventEmitter is set up before any imports
      if (!(window as any).EventEmitter) {
        // Define a proper EventEmitter class
        class EventEmitter {
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

        // Set the global EventEmitter
        (window as any).EventEmitter = EventEmitter;
        
        // Make sure prototype is properly set
        Object.setPrototypeOf(EventEmitter.prototype, Object.prototype);
      }
      
      // Add events module for proper inheritance
      if (!(window as any).events) {
        (window as any).events = { 
          EventEmitter: (window as any).EventEmitter 
        };
      }
      
      // Add window.global for browser environment
      if (!window.global) {
        (window as any).global = window;
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
      
      // If Node.js Buffer is used, provide a minimal polyfill
      if (!(window as any).Buffer) {
        (window as any).Buffer = {
          isBuffer: () => false
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
