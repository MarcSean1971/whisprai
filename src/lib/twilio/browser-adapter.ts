
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
    if (typeof window === 'undefined' || window.EventEmitter) return;

    class EventEmitter {
      private events: { [key: string]: Function[] };

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

      removeAllListeners() {
        this.events = {};
        return this;
      }
    }

    window.EventEmitter = EventEmitter as any;
    window.events = {
      EventEmitter: window.EventEmitter,
      defaultMaxListeners: 10,
      setMaxListeners: function() { return this; }
    };
  }
}

export function initializeTwilioEnvironment() {
  TwilioEnvironment.getInstance();
}
