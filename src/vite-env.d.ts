
/// <reference types="vite/client" />

interface Window {
  events?: {
    EventEmitter: any;
    defaultMaxListeners: number;
    setMaxListeners: Function;
  };
  EventEmitter?: any;
  process?: any;
  global?: Window;
  util?: {
    inherits: (ctor: any, superCtor: any) => void;
    [key: string]: any;
  };
  OT: {
    initSession: (apiKey: string, sessionId: string) => any;
    initPublisher: (targetElement: string, options: any) => any;
    version?: string;
    [key: string]: any;
  };
}
