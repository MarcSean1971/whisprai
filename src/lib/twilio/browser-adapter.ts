
// Minimal browser environment adapter for Twilio Client
import { EventEmitter } from 'events';

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
      // Use the proper events package
      window.EventEmitter = EventEmitter;
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
