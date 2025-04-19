
/// <reference types="vite/client" />

interface ProcessVersions {
  node: string;
  v8: string;
  uv: string;
  zlib: string;
  ares: string;
  modules: string;
  http_parser: string;
  openssl: string;
}

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
  // Add minimal Node.js Buffer compatibility methods
  equals(otherBuffer: Uint8Array): boolean;
  compare(target: Uint8Array): number;
  copy(target: Uint8Array, targetStart?: number, sourceStart?: number, sourceEnd?: number): number;
  slice(start?: number, end?: number): Buffer;
  toJSON(): { type: string; data: number[] };
  [Symbol.species]: NodeBuffer;
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
    versions: ProcessVersions;
    platform: string;
  };
  Buffer?: {
    isBuffer(obj: any): obj is Buffer;
    from(value: any): NodeBuffer;
    alloc(size: number): NodeBuffer;
  };
  global?: Window;
}
