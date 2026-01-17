// Mock phaser3spectorjs before Phaser tries to load it
// This must be done before any Phaser imports
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Module = require('module');
  const originalRequire = Module.prototype.require;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Module.prototype.require = function(id: string, ...args: unknown[]) {
    if (id === 'phaser3spectorjs') {
      return {}; // Return empty object for optional dependency
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return originalRequire.apply(this, [id, ...args] as any);
  };
} catch {
  // Module mocking not available, will try other approach
}

// Mock browser APIs that Phaser needs
class MockCanvas {
  getContext() {
    return {
      fillRect: () => {},
      clearRect: () => {},
      drawImage: () => {},
      getImageData: () => ({ data: [] }),
      putImageData: () => {},
      createImageData: () => ({ data: [] }),
      setTransform: () => {},
      resetTransform: () => {},
      save: () => {},
      restore: () => {},
      scale: () => {},
      rotate: () => {},
      translate: () => {},
      transform: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      bezierCurveTo: () => {},
      quadraticCurveTo: () => {},
      arc: () => {},
      arcTo: () => {},
      rect: () => {},
      fill: () => {},
      stroke: () => {},
      clip: () => {},
      isPointInPath: () => false,
      measureText: () => ({ width: 0 }),
      fillText: () => {},
      strokeText: () => {},
      createLinearGradient: () => ({
        addColorStop: () => {},
      }),
      createRadialGradient: () => ({
        addColorStop: () => {},
      }),
      createPattern: () => null,
    };
  }

  width = 800;
  height = 600;
  style = {};
  setAttribute() {}
  addEventListener() {}
  removeEventListener() {}
}

global.HTMLCanvasElement = MockCanvas as unknown as typeof HTMLCanvasElement;

// Mock requestAnimationFrame
global.requestAnimationFrame = ((cb: FrameRequestCallback) =>
  setTimeout(() => cb(Date.now()), 16)) as unknown as typeof requestAnimationFrame;
global.cancelAnimationFrame = clearTimeout as unknown as typeof cancelAnimationFrame;

// Mock window properties Phaser expects
const mockWindow = {
  addEventListener: () => {},
  removeEventListener: () => {},
  devicePixelRatio: 1,
  innerWidth: 1280,
  innerHeight: 720,
  ontouchstart: null,
};

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true,
  configurable: true,
});

// Also set it directly for Phaser's checks
(global as any).window = mockWindow;

// Mock document with documentElement (required by Phaser)
const mockDocumentElement = {
  ontouchstart: null,
  onwheel: null,
  onmousewheel: null,
};

Object.defineProperty(global, 'document', {
  value: {
    createElement: (tag: string) => {
      if (tag === 'canvas') {
        return new MockCanvas();
      }
      return {
        style: {},
        setAttribute: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
      } as unknown as HTMLElement;
    },
    body: {
      appendChild: () => {},
      removeChild: () => {},
    },
    getElementById: () => null,
    documentElement: mockDocumentElement,
  },
});

// Mock navigator (required by Phaser for touch detection)
Object.defineProperty(global, 'navigator', {
  value: {
    maxTouchPoints: 0,
    msPointerEnabled: false,
    pointerEnabled: false,
    getGamepads: null,
  },
  writable: true,
  configurable: true,
});
