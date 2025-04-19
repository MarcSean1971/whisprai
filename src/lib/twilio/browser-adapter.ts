
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
      // Define a proper EventEmitter class with prototype inheritance
      const EventEmitter = function(this: any) {
        this.events = {};
        return this;
      } as any;

      EventEmitter.prototype.on = function(this: any, event: string, listener: Function) {
        if (!this.events[event]) {
          this.events[event] = [];
        }
        this.events[event].push(listener);
        return this;
      };

      EventEmitter.prototype.emit = function(this: any, event: string, ...args: any[]) {
        if (!this.events[event]) return false;
        this.events[event].forEach((listener: Function) => listener(...args));
        return true;
      };

      EventEmitter.prototype.removeAllListeners = function(this: any, event?: string) {
        if (event) {
          delete this.events[event];
        } else {
          this.events = {};
        }
        return this;
      };

      // Make EventEmitter available globally
      window.EventEmitter = EventEmitter;
      
      // Set up the events module properly
      window.events = {
        EventEmitter: EventEmitter,
        defaultMaxListeners: 10,
        setMaxListeners: function() { return this; }
      };
    }
  }
}

export function initializeTwilioEnvironment() {
  try {
    TwilioEnvironment.getInstance();
    console.log('Successfully initialized Twilio browser environment');
  } catch (error) {
    console.error('Failed to initialize Twilio browser environment:', error);
    throw error;
  }
}
