
import { Device } from 'twilio-client';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useDeviceSetup() {
  const setupPolyfills = () => {
    if (typeof window !== 'undefined') {
      // Create a proper EventEmitter class with correct prototype chain
      function EventEmitter() {
        this.events = {};
      }
      
      EventEmitter.prototype.on = function(event, listener) {
        if (!this.events[event]) {
          this.events[event] = [];
        }
        this.events[event].push(listener);
        return this;
      };
      
      EventEmitter.prototype.removeListener = function(event, listener) {
        if (!this.events[event]) return this;
        this.events[event] = this.events[event].filter(l => l !== listener);
        return this;
      };
      
      EventEmitter.prototype.emit = function(event, ...args) {
        if (!this.events[event]) return false;
        this.events[event].forEach(listener => listener(...args));
        return true;
      };

      // Add other EventEmitter methods that Twilio might use
      EventEmitter.prototype.once = function(event, listener) {
        const onceWrapper = (...args) => {
          listener(...args);
          this.removeListener(event, onceWrapper);
        };
        this.on(event, onceWrapper);
        return this;
      };

      EventEmitter.prototype.removeAllListeners = function(event) {
        if (event) {
          delete this.events[event];
        } else {
          this.events = {};
        }
        return this;
      };

      // Directly set these properties on window for maximum compatibility
      window.EventEmitter = EventEmitter;
      window.events = {
        EventEmitter: EventEmitter,
        defaultMaxListeners: 10,
        setMaxListeners: function() { return this; }
      };
      
      // Ensure proper exports for both named and default
      window.events.default = window.events;
      
      // Define process for Node.js compatibility
      if (!window.process) {
        window.process = {
          nextTick: (fn) => setTimeout(fn, 0),
          env: { NODE_ENV: 'production' },
          version: '',
          versions: { node: '14.0.0' },
          platform: 'browser'
        };
      }
      
      // Define Buffer for Node.js compatibility
      if (!window.Buffer) {
        window.Buffer = {
          isBuffer: () => false,
          from: (value) => ({ value }),
          alloc: (size) => new Uint8Array(size)
        };
      }

      // Define global for Node.js compatibility
      if (!window.global) {
        window.global = window;
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
