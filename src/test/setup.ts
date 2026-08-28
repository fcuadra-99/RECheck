import '@testing-library/jest-dom/vitest';

// Basic stubs for browser APIs used in components
if (!('Notification' in globalThis)) {
  // @ts-ignore
  globalThis.Notification = {
    requestPermission: async () => 'granted',
  } as any;
}

if (!('navigator' in globalThis)) {
  // @ts-ignore
  globalThis.navigator = {} as any;
}

try {
  // @ts-ignore
  if (!globalThis.navigator.userAgent) {
    Object.defineProperty(globalThis.navigator, 'userAgent', {
      configurable: true,
      get: () => 'vitest-agent',
    });
  }
} catch {
  // ignore if jsdom blocks this
}

// service worker controller stub
// @ts-ignore
globalThis.navigator.serviceWorker = globalThis.navigator.serviceWorker || ({ controller: { postMessage: () => {} } } as any);

class IO {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(_cb?: any, _opts?: any) {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  observe() {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  unobserve() {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  disconnect() {}
}

// IntersectionObserver and ResizeObserver stubs
// @ts-ignore
globalThis.IntersectionObserver = globalThis.IntersectionObserver || IO;
// @ts-ignore
globalThis.ResizeObserver = globalThis.ResizeObserver || IO;


