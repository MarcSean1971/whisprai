
// Minimal browser environment adapter for Twilio Client
class TwilioEnvironment {
  private static instance: TwilioEnvironment;

  private constructor() {
    this.setupGlobalObject();
    this.setupProcess();
    this.setupEventEmitter();
  }

  static getInstance(): TwilioEnvironment {
    if (!TwilioEnvironment.instance) {
      TwilioEnvironment.instance = new TwilioEnvironment();
    }
    return TwilioEnvironment.instance;
  }

  private setupGlobalObject() {
    if (typeof window !== 'undefined' && !window.global) {
      window.global = window;
    }
  }

  private setupProcess() {
    if (typeof window !== 'undefined' && !window.process) {
      window.process = {
        nextTick: (fn: Function) => setTimeout(() => fn(), 0),
        env: { NODE_ENV: 'production' }
      } as any;
    }
  }

  private setupEventEmitter() {
    if (typeof window !== 'undefined') {
      // Define a proper EventEmitter class
      class EventEmitter {
        private events: { [key: string]: Function[] } = {};

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

        emit(event: string, ...args: any[]) {
          if (!this.events[event]) return false;
          this.events[event].forEach((listener) => listener(...args));
          return true;
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

      // Create a proper prototype chain for EventEmitter
      window.EventEmitter = EventEmitter;
      
      // Set up the events module
      window.events = {
        EventEmitter: EventEmitter,
        defaultMaxListeners: 10,
        setMaxListeners: function() { return this; }
      };
    }
  }
}

export function initializeTwilioEnvironment() {
  TwilioEnvironment.getInstance();
}
