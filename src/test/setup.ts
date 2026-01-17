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
Object.defineProperty(global, 'window', {
  value: {
    addEventListener: () => {},
    removeEventListener: () => {},
    devicePixelRatio: 1,
    innerWidth: 1280,
    innerHeight: 720,
  },
});

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
      };
    },
    body: {
      appendChild: () => {},
      removeChild: () => {},
    },
    getElementById: () => null,
  },
});
