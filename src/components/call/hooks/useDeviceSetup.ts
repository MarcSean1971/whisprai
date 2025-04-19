
import { Device } from 'twilio-client';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useDeviceSetup() {
  const setupPolyfills = () => {
    if (typeof window !== 'undefined') {
      // Create a proper EventEmitter class with correct prototype chain
      class EventEmitter {
        private events: Record<string, Function[]>;
        
        constructor() {
          this.events = {};
        }
        
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

        // Add other EventEmitter methods that Twilio might use
        once(event: string, listener: Function) {
          const onceWrapper = (...args: any[]) => {
            listener(...args);
            this.removeListener(event, onceWrapper);
          };
          this.on(event, onceWrapper);
          return this;
        }

        removeAllListeners(event?: string) {
          if (event) {
            delete this.events[event];
          } else {
            this.events = {};
          }
          return this;
        }
      }

      // Ensure EventEmitter.prototype is properly set up
      const emitterProto = EventEmitter.prototype;
      
      // Set up EventEmitter on window
      (window as any).EventEmitter = EventEmitter;
      
      // Create events module structure that Twilio expects
      (window as any).events = {
        EventEmitter,
        defaultMaxListeners: 10,
        setMaxListeners: function() { return this; }
      };
      
      // Ensure proper exports for both named and default
      (window as any).events.default = (window as any).events;
      
      // Define process for Node.js compatibility
      if (!(window as any).process) {
        (window as any).process = {
          nextTick: (fn: Function) => setTimeout(fn, 0),
          env: { NODE_ENV: 'production' },
          version: '',
          versions: { node: '14.0.0' },
          platform: 'browser'
        };
      }
      
      // Define Buffer for Node.js compatibility
      if (!(window as any).Buffer) {
        (window as any).Buffer = {
          isBuffer: () => false,
          from: (value: any) => ({ value }),
          alloc: (size: number) => new Uint8Array(size)
        };
      }

      // Define global for Node.js compatibility
      if (!(window as any).global) {
        (window as any).global = window;
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

    // Create a new Device instance
    const device = new Device();
    
    try {
      // Setup the device with the token
      await device.setup(data.token, {
        debug: true,
        allowIncomingWhileBusy: true,
        codecPreferences: ['opus', 'pcmu'] as any
      });
      
      return device;
    } catch (err) {
      console.error('Error in device setup:', err);
      throw err;
    }
  };

  return {
    setupPolyfills,
    initializeDevice
  };
}
