
import { Device } from 'twilio-client';
import { supabase } from '@/integrations/supabase/client';

export function useDeviceSetup() {
  const setupPolyfills = () => {
    if (typeof window !== 'undefined') {
      function EventEmitterConstructor(this: EventEmitter) {
        this.events = {};
      }

      EventEmitterConstructor.prototype.on = function(event, listener) {
        if (!this.events[event]) {
          this.events[event] = [];
        }
        this.events[event].push(listener);
        return this;
      };

      EventEmitterConstructor.prototype.removeListener = function(event, listener) {
        if (!this.events[event]) return this;
        this.events[event] = this.events[event].filter(l => l !== listener);
        return this;
      };

      EventEmitterConstructor.prototype.emit = function(event, ...args) {
        if (!this.events[event]) return false;
        this.events[event].forEach(listener => listener(...args));
        return true;
      };

      EventEmitterConstructor.prototype.once = function(event, listener) {
        const onceWrapper = (...args: any[]) => {
          listener(...args);
          this.removeListener(event, onceWrapper);
        };
        this.on(event, onceWrapper);
        return this;
      };

      EventEmitterConstructor.prototype.removeAllListeners = function(event) {
        if (event) {
          delete this.events[event];
        } else {
          this.events = {};
        }
        return this;
      };

      // Set up window.events and EventEmitter
      window.EventEmitter = EventEmitterConstructor as any as EventEmitterConstructor;
      window.events = {
        EventEmitter: window.EventEmitter,
        defaultMaxListeners: 10,
        setMaxListeners: function() { return this; }
      };

      // Set up process
      if (!window.process) {
        window.process = {
          nextTick: (fn) => setTimeout(fn, 0),
          env: { NODE_ENV: 'production' },
          version: 'v14.0.0',
          versions: {
            node: '14.0.0',
            v8: '8.0.0',
            uv: '1.0.0',
            zlib: '1.0.0',
            ares: '1.0.0',
            modules: '83',
            http_parser: '2.9.3',
            openssl: '1.1.1' // Added the missing openssl version
          } as ProcessVersions,
          platform: 'browser'
        };
      }

      // Set up Buffer
      if (!window.Buffer) {
        class NodeBufferImpl extends Uint8Array implements NodeBuffer {
          write(string: string, encoding?: BufferEncoding): number {
            // Simple implementation
            const buf = new TextEncoder().encode(string);
            this.set(buf);
            return buf.length;
          }

          toString(encoding?: BufferEncoding): string {
            return new TextDecoder().decode(this);
          }

          // Add minimal implementations for required methods
          equals(otherBuffer: Uint8Array): boolean {
            if (this.length !== otherBuffer.length) return false;
            for (let i = 0; i < this.length; i++) {
              if (this[i] !== otherBuffer[i]) return false;
            }
            return true;
          }

          compare(target: Uint8Array): number {
            const len = Math.min(this.length, target.length);
            for (let i = 0; i < len; i++) {
              if (this[i] !== target[i]) {
                return this[i] < target[i] ? -1 : 1;
              }
            }
            if (this.length < target.length) return -1;
            if (this.length > target.length) return 1;
            return 0;
          }

          copy(target: Uint8Array, targetStart = 0, sourceStart = 0, sourceEnd = this.length): number {
            const len = Math.min(sourceEnd - sourceStart, target.length - targetStart, this.length - sourceStart);
            for (let i = 0; i < len; i++) {
              target[targetStart + i] = this[sourceStart + i];
            }
            return len;
          }

          slice(start = 0, end = this.length): Buffer {
            const newBuf = new NodeBufferImpl(end - start);
            for (let i = 0; i < end - start; i++) {
              newBuf[i] = this[i + start];
            }
            return newBuf as unknown as Buffer;
          }

          toJSON(): { type: string; data: number[] } {
            return {
              type: 'Buffer',
              data: Array.from(this)
            };
          }
        }

        // Add Symbol.species if supported by the environment
        if (typeof Symbol !== 'undefined' && Symbol.species) {
          Object.defineProperty(NodeBufferImpl, Symbol.species, {
            get: function() { return NodeBufferImpl; }
          });
        }

        // Create type-compatible Buffer methods
        const bufferFrom = (value: any): NodeBuffer => {
          if (typeof value === 'string') {
            return new NodeBufferImpl(new TextEncoder().encode(value)) as NodeBuffer;
          }
          return new NodeBufferImpl(value) as NodeBuffer;
        };

        const bufferAlloc = (size: number): NodeBuffer => {
          return new NodeBufferImpl(size) as NodeBuffer;
        };

        // Use type assertion to satisfy the complex TypeScript interface
        window.Buffer = {
          isBuffer: (obj): obj is Buffer => obj instanceof Uint8Array,
          from: bufferFrom as any,
          alloc: bufferAlloc as any
        };
      }

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
