
import { Device } from 'twilio-client';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useDeviceSetup() {
  const setupPolyfills = () => {
    if (typeof window !== 'undefined') {
      // Initialize EventEmitter with proper prototype chain
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
      }

      // Setup events module for CommonJS/Node.js compatibility
      if (!(window as any).events || !(window as any).events.EventEmitter) {
        // Create full events module structure
        (window as any).events = {
          EventEmitter: (window as any).EventEmitter
        };
        
        // Also make it available as a named export and default export
        (window as any).events.default = (window as any).events;
      }
      
      // Add better support for Node.js built-ins
      // Define global for Node.js compatibility
      if (!(window as any).global) {
        (window as any).global = window;
      }
      
      // Define process for Node.js compatibility
      if (!(window as any).process) {
        (window as any).process = {
          nextTick: (fn: Function) => setTimeout(fn, 0),
          env: {},
          version: '',
          versions: {},
          platform: 'browser'
        };
      }
      
      // Define Buffer for Node.js compatibility
      if (!(window as any).Buffer) {
        (window as any).Buffer = {
          isBuffer: () => false,
          from: (value: any) => ({ value })
        };
      }
      
      // Properly define require for CommonJS modules
      if (!(window as any).require) {
        (window as any).require = function(moduleName: string) {
          if (moduleName === 'events') {
            return (window as any).events;
          }
          throw new Error(`Module ${moduleName} not found`);
        };
      }
      
      // Fix Object.setPrototypeOf usage with undefined prototype
      const originalSetPrototypeOf = Object.setPrototypeOf;
      Object.setPrototypeOf = function(obj: any, proto: any) {
        if (proto === undefined) {
          console.warn('Attempted to set prototype to undefined, using Object.prototype instead');
          return originalSetPrototypeOf(obj, Object.prototype);
        }
        return originalSetPrototypeOf(obj, proto);
      };
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
