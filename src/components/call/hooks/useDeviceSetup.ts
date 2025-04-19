
import { Device } from 'twilio-client';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useDeviceSetup() {
  const setupPolyfills = () => {
    if (typeof window !== 'undefined') {
      // Create a mock EventEmitter to prevent errors with twilio-client
      class EventEmitter {
        constructor() {
          this.events = {};
        }
        
        on(event, listener) {
          if (!this.events[event]) {
            this.events[event] = [];
          }
          this.events[event].push(listener);
          return this;
        }
        
        removeListener(event, listener) {
          if (!this.events[event]) return this;
          this.events[event] = this.events[event].filter(l => l !== listener);
          return this;
        }
        
        emit(event, ...args) {
          if (!this.events[event]) return false;
          this.events[event].forEach(listener => listener(...args));
          return true;
        }
      }
      
      // Set a mock EventEmitter to window to prevent the undefined error
      (window as any).EventEmitter = EventEmitter;
      
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
