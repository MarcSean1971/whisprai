
/// <reference types="vite/client" />

interface EventEmitter {
  on(event: string, listener: Function): this;
  removeListener(event: string, listener: Function): this;
  emit(event: string, ...args: any[]): boolean;
  once(event: string, listener: Function): this;
  removeAllListeners(event?: string): this;
}

interface EventsModule {
  EventEmitter: {
    new(): EventEmitter;
    prototype: EventEmitter;
  };
  defaultMaxListeners: number;
  setMaxListeners: Function;
  default?: EventsModule;
}

interface Window {
  events: EventsModule;
  EventEmitter: {
    new(): EventEmitter;
    prototype: EventEmitter;
  };
  process?: {
    nextTick: (fn: Function) => void;
    env: { NODE_ENV: string };
    version: string;
    versions: { node: string };
    platform: string;
  };
  Buffer?: {
    isBuffer: (obj: any) => boolean;
    from: (value: any) => { value: any };
    alloc: (size: number) => Uint8Array;
  };
  global?: Window;
}
