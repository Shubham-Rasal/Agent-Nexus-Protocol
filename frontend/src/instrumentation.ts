/**
 * Next.js instrumentation hook — runs once at server startup before any routes compile.
 */
export async function register() {
  // Patch String.prototype.repeat to tolerate negative counts.
  // React's dev-mode SSR error formatter contains ' '.repeat(i * 2 + 2) where
  // `i` can be negative (Turbopack/Next.js 15 bug), causing RangeError that
  // crashes the entire Node process. This makes it a no-op instead.
  const _origRepeat = String.prototype.repeat;
  String.prototype.repeat = function (this: string, count: number) {
    if (count < 0) return "";
    return _origRepeat.call(this, count);
  };

  if (typeof globalThis.indexedDB === "undefined") {
    // Polyfill indexedDB to prevent WalletConnect SSR crash.
    (globalThis as any).indexedDB = {
      open: () => {
        const req: any = {};
        req.addEventListener = () => req;
        req.removeEventListener = () => req;
        return req;
      },
      deleteDatabase: () => {
        const req: any = {};
        req.addEventListener = () => req;
        return req;
      },
      databases: () => Promise.resolve([]),
      cmp: () => 0,
    };
  }
}
