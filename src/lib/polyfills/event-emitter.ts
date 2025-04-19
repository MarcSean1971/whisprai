
export function setupEventEmitterPolyfill() {
  if (typeof window === 'undefined') return;

  function EventEmitterConstructor(this: EventEmitter) {
    this.events = {};
  }

  EventEmitterConstructor.prototype.on = function(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  };

  EventEmitterConstructor.prototype.removeListener = function(event, listener) {
    if (!this.events[event]) return this;
    this.events[event] = this.events[event].filter(l => l !== listener);
    return this;
  };

  EventEmitterConstructor.prototype.emit = function(event, ...args) {
    if (!this.events[event]) return false;
    this.events[event].forEach(listener => listener(...args));
    return true;
  };

  EventEmitterConstructor.prototype.once = function(event, listener) {
    const onceWrapper = (...args: any[]) => {
      listener(...args);
      this.removeListener(event, onceWrapper);
    };
    this.on(event, onceWrapper);
    return this;
  };

  EventEmitterConstructor.prototype.removeAllListeners = function(event) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
    return this;
  };

  window.EventEmitter = EventEmitterConstructor as any as EventEmitterConstructor;
  window.events = {
    EventEmitter: window.EventEmitter,
    defaultMaxListeners: 10,
    setMaxListeners: function() { return this; }
  };
}
