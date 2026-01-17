import Phaser from 'phaser';

export class DayNightOverlay {
  private overlay: Phaser.GameObjects.Graphics;
  private width = 3280;
  private height = 2720;
  private offsetX = -1000;
  private offsetY = -2000;

  constructor(scene: Phaser.Scene) {
    this.overlay = scene.add.graphics();
    this.overlay.setDepth(50); // Above rooms, below UI
    this.overlay.setBlendMode(Phaser.BlendModes.MULTIPLY);
  }

  update(hour: number): void {
    this.overlay.clear();

    // Calculate overlay based on time
    // Night: 20-6 has blue overlay
    // Dawn/Dusk: 6-8 and 18-20 have gradual transition

    let alpha = 0;
    let color = 0x4a6aaa; // Blue-ish night color

    if (hour >= 20 || hour < 6) {
      // Night time - full overlay
      alpha = 0.35;
      color = 0x3a4a6a;
    } else if (hour >= 6 && hour < 8) {
      // Dawn - fading out
      const t = (hour - 6) / 2;
      alpha = 0.35 * (1 - t);
      color = this.interpolateColor(0x3a4a6a, 0x8a7a6a, t); // Blue to warm
    } else if (hour >= 18 && hour < 20) {
      // Dusk - fading in
      const t = (hour - 18) / 2;
      alpha = 0.35 * t;
      color = this.interpolateColor(0x8a6a5a, 0x3a4a6a, t); // Warm to blue
    }

    if (alpha > 0) {
      this.overlay.fillStyle(color, alpha);
      this.overlay.fillRect(this.offsetX, this.offsetY, this.width, this.height);
    }
  }

  private interpolateColor(color1: number, color2: number, t: number): number {
    const r1 = (color1 >> 16) & 0xff;
    const g1 = (color1 >> 8) & 0xff;
    const b1 = color1 & 0xff;

    const r2 = (color2 >> 16) & 0xff;
    const g2 = (color2 >> 8) & 0xff;
    const b2 = color2 & 0xff;

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return (r << 16) | (g << 8) | b;
  }

  getOverlayIntensity(hour: number): number {
    // Returns 0-1 for how "night" it is (for room glow effects)
    if (hour >= 20 || hour < 6) {
      return 1;
    } else if (hour >= 6 && hour < 8) {
      return 1 - (hour - 6) / 2;
    } else if (hour >= 18 && hour < 20) {
      return (hour - 18) / 2;
    }
    return 0;
  }

  destroy(): void {
    this.overlay.destroy();
  }
}
