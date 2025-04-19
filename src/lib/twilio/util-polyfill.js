
// Minimal polyfill for Node.js util module
export function inherits(ctor, superCtor) {
  if (superCtor) {
    ctor.super_ = superCtor;
    Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
  }
}

export default {
  inherits,
  // Add other util functions as needed
};
