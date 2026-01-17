import Phaser from 'phaser';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: number;
}

export class AtmosphericEffects {
  private graphics: Phaser.GameObjects.Graphics;
  private particles: Particle[] = [];
  private width = 3280;
  private height = 2720;
  private offsetX = -1000;
  private offsetY = -2000;
  private particleCount = 50;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(60); // Above rooms, below UI

    // Initialize particles
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push(this.createParticle());
    }
  }

  private createParticle(): Particle {
    // Dust/atmospheric particle colors
    const colors = [0xe4d4c4, 0xd4c4b4, 0xc4b4a4, 0xf4e4d4];

    return {
      x: this.offsetX + Math.random() * this.width,
      y: this.offsetY + Math.random() * this.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.2 - 0.1, // Slight upward drift
      size: 1 + Math.random() * 2,
      alpha: 0.1 + Math.random() * 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
  }

  update(delta: number): void {
    this.graphics.clear();

    // Update and draw particles
    this.particles.forEach((particle) => {
      // Move particle
      particle.x += particle.vx * (delta / 16);
      particle.y += particle.vy * (delta / 16);

      // Wrap around
      if (particle.x < this.offsetX) {
        particle.x = this.offsetX + this.width;
      } else if (particle.x > this.offsetX + this.width) {
        particle.x = this.offsetX;
      }

      if (particle.y < this.offsetY) {
        particle.y = this.offsetY + this.height;
      } else if (particle.y > this.offsetY + this.height) {
        particle.y = this.offsetY;
      }

      // Draw particle
      this.graphics.fillStyle(particle.color, particle.alpha);
      this.graphics.fillCircle(particle.x, particle.y, particle.size);
    });
  }

  destroy(): void {
    this.graphics.destroy();
  }
}
