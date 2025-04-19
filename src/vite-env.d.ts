
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
  [key: string]: string; // Index signature for compatibility with NodeJS.ProcessVersions
}

interface Process {
  stdout: any;
  stderr: any;
  stdin: any;
  argv: string[];
  argv0: string;
  execArgv: string[];
  execPath: string;
  abort(): never;
  chdir(directory: string): void;
  cwd(): string;
  debugPort?: number;
  dlopen?(): void;
  emitWarning?(): void;
  finalization?(): void;
  exit(code?: number): never;
  kill(pid: number, signal?: string | number): true;
  pid: number;
  ppid: number;
  title: string;
  arch: string;
  platform: "darwin" | "win32" | "linux" | "aix" | "android" | "freebsd" | "haiku" | "openbsd" | "sunos" | "cygwin" | "netbsd";
  // Add additional properties from the error message
  mainModule?: any;
  hasUncaughtExceptionCaptureCallback?: boolean;
  version: string;
  versions: ProcessVersions;
  binding?: (name: string) => any;
  config?: any;
  env: { [key: string]: string };
  features?: { [key: string]: boolean };
  hrtime?: () => [number, number];
  memoryUsage?: () => any;
  nextTick: (callback: Function, ...args: any[]) => void;
  release?: { [key: string]: string };
  resourceUsage?: () => any;
  umask?: () => number;
  uptime?: () => number;
  disconnect?: () => void;
  addListener?: (event: string, listener: Function) => Process;
  domain?: any;
  eventNames?: () => string[];
  getMaxListeners?: () => number;
  listenerCount?: (type: string) => number;
  listeners?: (event: string) => Function[];
  off?: (event: string, listener: Function) => Process;
  on?: (event: string, listener: Function) => Process;
  once?: (event: string, listener: Function) => Process;
  prependListener?: (event: string, listener: Function) => Process;
  prependOnceListener?: (event: string, listener: Function) => Process;
  rawListeners?: (event: string) => Function[];
  removeAllListeners?: (event?: string) => Process;
  removeListener?: (event: string, listener: Function) => Process;
  setMaxListeners?: (n: number) => Process;
  setUncaughtExceptionCaptureCallback?: (cb: ((err: Error) => void) | null) => void;
  allowedNodeEnvironmentFlags?: Set<string>;
  cpuUsage?: (previousValue?: { user: number; system: number }) => { user: number; system: number };
  moduleLoadList?: string[];
  reporterAccessors?: any;
  setegid?: (id: number | string) => void;
  seteuid?: (id: number | string) => void;
  setgid?: (id: number | string) => void;
  setgroups?: (groups: Array<string | number>) => void;
  setuid?: (id: number | string) => void;
  report?: any;
  // Add other required Process properties
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
  equals(otherBuffer: Uint8Array): boolean;
  compare(target: Uint8Array): number;
  copy(target: Uint8Array, targetStart?: number, sourceStart?: number, sourceEnd?: number): number;
  slice(start?: number, end?: number): Buffer;
  toJSON(): { type: string; data: number[] };
  [Symbol.species]: NodeBuffer;
}

interface BufferConstructor {
  isBuffer(obj: any): obj is Buffer;
  from(value: any): NodeBuffer;
  alloc(size: number): NodeBuffer;
  of(...items: number[]): Buffer;
  isEncoding(encoding: string): encoding is BufferEncoding;
  byteLength(string: string | ArrayBuffer | SharedArrayBuffer | Uint8Array, encoding?: BufferEncoding): number;
  concat(list: Uint8Array[], totalLength?: number): Buffer;
  compare(buf1: Uint8Array, buf2: Uint8Array): number;
  poolSize: number;
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
    env: { NODE_ENV: string; [key: string]: string };
    version: string;
    versions: ProcessVersions;
    platform: "darwin" | "win32" | "linux" | "aix" | "android" | "freebsd" | "haiku" | "openbsd" | "sunos" | "cygwin" | "netbsd";
    stdout?: any;
    stderr?: any;
    stdin?: any;
    argv?: string[];
    pid?: number;
    arch?: string;
    title?: string;
    cwd?: () => string;
    exit?: (code?: number) => never;
    argv0?: string;
    execArgv?: string[];
    execPath?: string;
    abort?: () => never;
    chdir?: (directory: string) => void;
    kill?: (pid: number, signal?: string | number) => boolean;
    ppid?: number;
  } & Partial<Process>;
  Buffer?: BufferConstructor;
  global?: Window;
}
