
import { setupEventEmitterPolyfill } from './event-emitter';
import { setupProcessPolyfill } from './process';
import { setupBufferPolyfill } from './buffer';

export function setupPolyfills() {
  if (typeof window === 'undefined') return;

  setupEventEmitterPolyfill();
  setupProcessPolyfill();
  setupBufferPolyfill();

  if (!window.global) {
    window.global = window;
  }
}
