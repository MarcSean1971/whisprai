
// Minimal browser environment adapter for Twilio Client
class TwilioEnvironment {
  private static instance: TwilioEnvironment;
  private _eventEmitter: any;

  private constructor() {
    this.setupGlobalEventEmitter();
    this.setupMinimalProcess();
  }

  static getInstance(): TwilioEnvironment {
    if (!TwilioEnvironment.instance) {
      TwilioEnvironment.instance = new TwilioEnvironment();
    }
    return TwilioEnvironment.instance;
  }

  private setupGlobalEventEmitter() {
    if (typeof window === 'undefined' || window.EventEmitter) return;

    const EventEmitter = function(this: any) {
      this.events = {};
    };

    EventEmitter.prototype.on = function(event: string, listener: Function) {
      if (!this.events[event]) {
        this.events[event] = [];
      }
      this.events[event].push(listener);
      return this;
    };

    EventEmitter.prototype.emit = function(event: string, ...args: any[]) {
      if (!this.events[event]) return false;
      this.events[event].forEach((listener: Function) => listener(...args));
      return true;
    };

    window.EventEmitter = EventEmitter as any;
    window.events = {
      EventEmitter: window.EventEmitter,
      defaultMaxListeners: 10,
      setMaxListeners: function() { return this; }
    };
  }

  private setupMinimalProcess() {
    if (typeof window === 'undefined' || window.process) return;

    // Only implement what Twilio actually needs
    const minimalProcess = {
      nextTick: (fn: Function) => setTimeout(() => fn(), 0),
      env: {
        NODE_ENV: 'production'
      },
      version: 'v14.0.0',
      versions: {
        node: '14.0.0'
      } as any,
      platform: 'browser' as any
    };

    // Use type assertion to bypass strict type checking
    window.process = minimalProcess as any;
  }

  initialize() {
    if (typeof window === 'undefined') return;
    
    // Ensure global is defined
    if (!window.global) {
      window.global = window;
    }
  }
}

export function initializeTwilioEnvironment() {
  const env = TwilioEnvironment.getInstance();
  env.initialize();
}
