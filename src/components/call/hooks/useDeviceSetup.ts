
import { Device } from 'twilio-client';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useDeviceSetup() {
  const setupPolyfills = () => {
    if (typeof window !== 'undefined') {
      // Create a proper EventEmitter class first - BEFORE any other setup
      if (!(window as any).EventEmitter) {
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

        // Make EventEmitter available globally
        (window as any).EventEmitter = EventEmitter;
        
        // Ensure proper prototype inheritance
        if (typeof Object.setPrototypeOf === 'function') {
          try {
            Object.setPrototypeOf(EventEmitter.prototype, Object.prototype);
          } catch (e) {
            console.error('Error setting prototype:', e);
          }
        }
      }
      
      // Set up 'events' module for proper module resolution
      if (!(window as any).events) {
        // Create the module structure
        (window as any).events = {
          EventEmitter: (window as any).EventEmitter
        };
      }
      
      // Ensure global is defined for browser compatibility
      if (!(window as any).global) {
        (window as any).global = window;
      }
      
      // Ensure process object exists for Node.js compatibility
      if (!(window as any).process) {
        (window as any).process = {
          nextTick: (fn: Function) => setTimeout(fn, 0),
          env: {},
          version: '',
          versions: {},
          platform: 'browser'
        };
      }
      
      // Provide minimal Buffer implementation if needed
      if (!(window as any).Buffer) {
        (window as any).Buffer = {
          isBuffer: () => false,
          from: (value: any) => ({ value })
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
