
export function setupBufferPolyfill() {
  if (typeof window === 'undefined' || window.Buffer) return;

  class NodeBufferImpl extends Uint8Array {
    write(string: string, encoding?: BufferEncoding): number {
      const buf = new TextEncoder().encode(string);
      this.set(buf);
      return buf.length;
    }

    toString(encoding?: BufferEncoding): string {
      return new TextDecoder().decode(this);
    }

    equals(otherBuffer: Uint8Array): boolean {
      if (this.length !== otherBuffer.length) return false;
      for (let i = 0; i < this.length; i++) {
        if (this[i] !== otherBuffer[i]) return false;
      }
      return true;
    }

    compare(target: Uint8Array): number {
      const len = Math.min(this.length, target.length);
      for (let i = 0; i < len; i++) {
        if (this[i] !== target[i]) {
          return this[i] < target[i] ? -1 : 1;
        }
      }
      if (this.length < target.length) return -1;
      if (this.length > target.length) return 1;
      return 0;
    }

    copy(target: Uint8Array, targetStart = 0, sourceStart = 0, sourceEnd = this.length): number {
      const len = Math.min(sourceEnd - sourceStart, target.length - targetStart, this.length - sourceStart);
      for (let i = 0; i < len; i++) {
        target[targetStart + i] = this[sourceStart + i];
      }
      return len;
    }

    slice(start = 0, end = this.length): Buffer {
      const newBuf = new NodeBufferImpl(end - start);
      for (let i = 0; i < end - start; i++) {
        newBuf[i] = this[i + start];
      }
      return newBuf as unknown as Buffer;
    }

    toJSON(): { type: string; data: number[] } {
      return {
        type: 'Buffer',
        data: Array.from(this)
      };
    }

    static get [Symbol.species]() {
      return NodeBufferImpl;
    }
  }

  const bufferFrom = (value: any): NodeBuffer => {
    if (typeof value === 'string') {
      return new NodeBufferImpl(new TextEncoder().encode(value)) as NodeBuffer;
    }
    return new NodeBufferImpl(value) as NodeBuffer;
  };

  window.Buffer = {
    isBuffer: (obj): obj is Buffer => obj instanceof Uint8Array,
    from: bufferFrom as any,
    alloc: (size: number) => new NodeBufferImpl(size) as NodeBuffer,
    of: (...items: number[]): Buffer => new NodeBufferImpl(items) as unknown as Buffer,
    isEncoding: (encoding: string): encoding is BufferEncoding => {
      return ['utf8', 'utf-8', 'hex', 'base64'].includes(encoding.toLowerCase());
    },
    byteLength: (string: string | ArrayBuffer | SharedArrayBuffer | Uint8Array): number => {
      if (typeof string === 'string') {
        return new TextEncoder().encode(string).length;
      }
      if (string instanceof ArrayBuffer || string instanceof SharedArrayBuffer) {
        return string.byteLength;
      }
      return string.length;
    },
    concat: (list: Uint8Array[], totalLength?: number): Buffer => {
      if (list.length === 0) return new NodeBufferImpl(0) as unknown as Buffer;
      
      const length = totalLength !== undefined ? totalLength : 
        list.reduce((acc, buf) => acc + buf.length, 0);
      
      const result = new NodeBufferImpl(length);
      let offset = 0;
      for (const buf of list) {
        result.set(buf, offset);
        offset += buf.length;
      }
      
      return result as unknown as Buffer;
    },
    compare: (buf1: Uint8Array, buf2: Uint8Array): number => {
      const len = Math.min(buf1.length, buf2.length);
      for (let i = 0; i < len; i++) {
        if (buf1[i] !== buf2[i]) {
          return buf1[i] < buf2[i] ? -1 : 1;
        }
      }
      if (buf1.length < buf2.length) return -1;
      if (buf1.length > buf2.length) return 1;
      return 0;
    },
    poolSize: 8192
  } as BufferConstructor;
}
