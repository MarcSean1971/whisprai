
/// <reference types="vite/client" />

interface EventEmitter {
  events: { [key: string]: Function[] };
  on(event: string, listener: Function): this;
  removeListener(event: string, listener: Function): this;
  emit(event: string, ...args: any[]): boolean;
  once(event: string, listener: Function): this;
  removeAllListeners(event?: string): this;
}

interface EventEmitterConstructor {
  new(): EventEmitter;
  prototype: EventEmitter;
}

interface NodeBuffer extends Uint8Array {
  write(string: string, encoding?: BufferEncoding): number;
  toString(encoding?: BufferEncoding): string;
}

interface Window {
  events: {
    EventEmitter: EventEmitterConstructor;
    defaultMaxListeners: number;
    setMaxListeners: Function;
    default?: any;
  };
  EventEmitter: EventEmitterConstructor;
  process?: {
    nextTick: (fn: Function) => void;
    env: { NODE_ENV: string };
    version: string;
    versions: {
      node: string;
      v8: string;
      uv: string;
      zlib: string;
      ares: string;
      modules: string;
      http_parser: string;
    };
    platform: string;
  };
  Buffer?: {
    isBuffer(obj: any): obj is Buffer;
    from(value: any): NodeBuffer;
    alloc(size: number): NodeBuffer;
  };
  global?: Window;
}
