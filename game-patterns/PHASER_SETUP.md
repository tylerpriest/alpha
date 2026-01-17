# Phaser 3 + Vite + TypeScript Setup

## Quick Start

```bash
# Create project with Vite
npm create vite@latest my-game -- --template vanilla-ts
cd my-game

# Install Phaser
npm install phaser

# Install dev dependencies
npm install -D vitest @vitest/ui jsdom eslint prettier

# Start development
npm run dev
```

## Project Structure

```
my-game/
├── src/
│   ├── main.ts              # Entry point
│   ├── scenes/
│   │   ├── BootScene.ts     # Asset loading
│   │   ├── GameScene.ts     # Main gameplay
│   │   └── UIScene.ts       # HUD overlay
│   ├── entities/            # Game objects
│   ├── systems/             # Cross-cutting logic
│   ├── ui/                  # UI components
│   └── utils/
│       ├── constants.ts     # Game constants
│       └── types.ts         # TypeScript types
├── public/
│   └── assets/              # Sprites, audio
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

## Configuration Files

### vite.config.ts

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'esnext',
  },
  server: {
    port: 5173,
  },
});
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "lib": ["ESNext", "DOM", "DOM.Iterable"]
  },
  "include": ["src"]
}
```

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

### src/test/setup.ts

```typescript
// Mock canvas for Phaser
class MockCanvas {
  getContext() {
    return null;
  }
}

global.HTMLCanvasElement = MockCanvas as any;
```

## Entry Point

### index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Game</title>
    <style>
      * { margin: 0; padding: 0; }
      body { overflow: hidden; background: #000; }
      canvas { display: block; }
    </style>
  </head>
  <body>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

### src/main.ts

```typescript
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game',
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, GameScene, UIScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

new Phaser.Game(config);
```

## Scene Templates

### BootScene.ts (Asset Loading)

```typescript
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Show loading progress
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(440, 270, 400, 50);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(450, 280, 380 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
    });

    // Load assets
    // this.load.image('tileset', 'assets/tileset.png');
    // this.load.spritesheet('player', 'assets/player.png', { frameWidth: 32, frameHeight: 32 });
  }

  create(): void {
    this.scene.start('GameScene');
  }
}
```

### GameScene.ts (Main Gameplay)

```typescript
import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Launch UI as overlay
    this.scene.launch('UIScene');

    // Initialize game objects
    this.add.text(640, 360, 'Game Scene', {
      fontSize: '32px',
      color: '#fff',
    }).setOrigin(0.5);

    // Set up input
    this.input.on('pointerdown', this.handleClick, this);
  }

  update(time: number, delta: number): void {
    // Game loop logic
  }

  private handleClick(pointer: Phaser.Input.Pointer): void {
    console.log('Clicked:', pointer.x, pointer.y);
  }
}
```

### UIScene.ts (HUD Overlay)

```typescript
import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  private moneyText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    // HUD elements
    this.moneyText = this.add.text(16, 16, '$10,000', {
      fontSize: '24px',
      color: '#fff',
    });

    // Listen to registry changes from GameScene
    this.registry.events.on('changedata-money', this.updateMoney, this);
  }

  private updateMoney(parent: any, value: number): void {
    this.moneyText.setText(`$${value.toLocaleString()}`);
  }
}
```

## Cross-Scene Communication

### Using Registry

```typescript
// In GameScene: set value
this.registry.set('money', 10000);

// In UIScene: read value
const money = this.registry.get('money');

// React to changes
this.registry.events.on('changedata-money', (parent, value) => {
  this.updateDisplay(value);
});
```

### Using Events

```typescript
// Emit from GameScene
this.events.emit('player-damaged', { damage: 10 });

// Listen in UIScene (need reference to GameScene)
const gameScene = this.scene.get('GameScene');
gameScene.events.on('player-damaged', this.handleDamage, this);
```

## Package Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "validate": "npm run typecheck && npm run lint && npm test"
  }
}
```
