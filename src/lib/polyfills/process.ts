
export function setupProcessPolyfill() {
  if (typeof window === 'undefined' || window.process) return;

  window.process = {
    nextTick: (fn: Function, ...args: any[]): void => { 
      setTimeout(() => fn(...args), 0);
    },
    env: { 
      NODE_ENV: 'production',
      PATH: '/usr/local/bin:/usr/bin:/bin',
      HOME: '/home/user',
      LANG: 'en_US.UTF-8'
    },
    version: 'v14.0.0',
    versions: {
      node: '14.0.0',
      v8: '8.0.0',
      uv: '1.0.0',
      zlib: '1.0.0',
      ares: '1.0.0',
      modules: '83',
      http_parser: '2.9.3',
      openssl: '1.1.1'
    } as ProcessVersions,
    platform: "darwin" as const,
    stdout: {},
    stderr: {},
    stdin: {},
    argv: ['node', 'browser'],
    pid: 1,
    title: 'browser',
    arch: "x64",
    cwd: () => '/',
    exit: (code?: number) => { throw new Error(`Process exited with code ${code}`); },
    argv0: 'node',
    execArgv: [],
    execPath: '/usr/local/bin/node',
    abort: () => { throw new Error('Process aborted'); },
    chdir: (directory: string) => { /* Mock implementation */ },
    kill: (pid: number, signal?: string | number): true => {
      console.log(`Mock kill called with pid ${pid} and signal ${signal}`);
      return true;
    },
    ppid: 0,
    debugPort: 9229,
    dlopen: () => { /* Mock implementation */ },
    emitWarning: () => { /* Mock implementation */ },
    binding: (name: string) => ({}),
    features: { inspector: true },
    hrtime: () => [0, 0],
    memoryUsage: () => ({ 
      rss: 0, 
      heapTotal: 0, 
      heapUsed: 0, 
      external: 0,
      arrayBuffers: 0 
    }),
    umask: () => 0,
    uptime: () => 0,
    on: (event: string, listener: Function) => window.process as Process,
    once: (event: string, listener: Function) => window.process as Process,
    removeListener: (event: string, listener: Function) => window.process as Process,
    removeAllListeners: (event?: string) => window.process as Process,
    setMaxListeners: (n: number) => window.process as Process,
    getMaxListeners: () => 10,
    listeners: (event: string) => [],
    emit: (event: string, ...args: any[]) => false,
    prependListener: (event: string, listener: Function) => window.process as Process,
    prependOnceListener: (event: string, listener: Function) => window.process as Process,
    listenerCount: (type: string) => 0,
    cpuUsage: () => ({ user: 0, system: 0 }),
    resourceUsage: () => ({
      userCPUTime: 0,
      systemCPUTime: 0,
      maxRSS: 0,
      sharedMemorySize: 0
    })
  } as Process;
}
