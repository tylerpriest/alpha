import Phaser from 'phaser';

// Sky gradient colors by time period - Volcanic Venus palette
const SKY_COLORS = {
  dawn: { top: 0xd45a2a, bottom: 0xff6a1a },   // Deep orange to bright orange
  day: { top: 0xc84a1a, bottom: 0xe85a0a },    // Volcanic orange
  dusk: { top: 0x8a3a2a, bottom: 0xc84a1a },   // Deep red-orange
  night: { top: 0x2a1a1a, bottom: 0x4a2a1a },  // Dark volcanic red-brown
};


// Cloud layer configuration
interface CloudLayer {
  graphics: Phaser.GameObjects.Graphics;
  speed: number; // Parallax scroll speed multiplier
  alpha: number;
  clouds: CloudShape[];
}

interface CloudShape {
  x: number;
  y: number;
  width: number;
  height: number;
  color: number;
}

export class VenusAtmosphere {
  private scene: Phaser.Scene;
  private skyGradient: Phaser.GameObjects.Graphics;
  private cloudLayers: CloudLayer[] = [];
  private width = 3280;
  private height = 2720;
  private offsetX = -1000;
  private offsetY = -2000;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Create sky gradient background
    this.skyGradient = scene.add.graphics();
    this.skyGradient.setDepth(-100);

    // Create three cloud layers with different parallax speeds
    this.createCloudLayers();

    // Initial render
    this.updateSkyGradient(6); // Start at dawn
  }

  private createCloudLayers(): void {
    // Layer configs: speed, alpha, cloud count
    const layerConfigs = [
      { speed: 0.1, alpha: 0.3, count: 8 },   // Far clouds
      { speed: 0.3, alpha: 0.4, count: 6 },   // Mid clouds
      { speed: 0.5, alpha: 0.5, count: 5 },   // Near clouds
    ];

    layerConfigs.forEach((config, index) => {
      const graphics = this.scene.add.graphics();
      graphics.setDepth(-90 + index);

      const clouds: CloudShape[] = [];
      for (let i = 0; i < config.count; i++) {
        clouds.push(this.generateCloud(index));
      }

      this.cloudLayers.push({
        graphics,
        speed: config.speed,
        alpha: config.alpha,
        clouds,
      });
    });
  }

  private generateCloud(layerIndex: number): CloudShape {
    // Larger clouds for farther layers
    const baseWidth = 200 + layerIndex * 100;
    const baseHeight = 60 + layerIndex * 30;

    return {
      x: this.offsetX + Math.random() * this.width,
      y: this.offsetY + 200 + Math.random() * 800,
      width: baseWidth + Math.random() * 200,
      height: baseHeight + Math.random() * 40,
      color: this.getCloudColor(Math.random()),
    };
  }

  private getCloudColor(variation: number): number {
    // Cloud colors - volcanic orange/brown smoke
    const colors = [0x8a4a2a, 0x6a3a1a, 0x5a2a1a, 0x7a3a2a];
    return colors[Math.floor(variation * colors.length)];
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

  private getSkyColors(hour: number): { top: number; bottom: number } {
    // Dawn: 5-8, Day: 8-18, Dusk: 18-21, Night: 21-5
    if (hour >= 5 && hour < 8) {
      // Dawn transition
      const t = (hour - 5) / 3;
      return {
        top: this.interpolateColor(SKY_COLORS.night.top, SKY_COLORS.dawn.top, t),
        bottom: this.interpolateColor(SKY_COLORS.night.bottom, SKY_COLORS.dawn.bottom, t),
      };
    } else if (hour >= 8 && hour < 18) {
      // Day - interpolate dawn to day to dusk
      if (hour < 12) {
        const t = (hour - 8) / 4;
        return {
          top: this.interpolateColor(SKY_COLORS.dawn.top, SKY_COLORS.day.top, t),
          bottom: this.interpolateColor(SKY_COLORS.dawn.bottom, SKY_COLORS.day.bottom, t),
        };
      } else {
        const t = (hour - 12) / 6;
        return {
          top: this.interpolateColor(SKY_COLORS.day.top, SKY_COLORS.dusk.top, t),
          bottom: this.interpolateColor(SKY_COLORS.day.bottom, SKY_COLORS.dusk.bottom, t),
        };
      }
    } else if (hour >= 18 && hour < 21) {
      // Dusk transition
      const t = (hour - 18) / 3;
      return {
        top: this.interpolateColor(SKY_COLORS.dusk.top, SKY_COLORS.night.top, t),
        bottom: this.interpolateColor(SKY_COLORS.dusk.bottom, SKY_COLORS.night.bottom, t),
      };
    } else {
      // Night
      return SKY_COLORS.night;
    }
  }

  private updateSkyGradient(hour: number): void {
    const colors = this.getSkyColors(hour);

    this.skyGradient.clear();

    // Draw gradient using horizontal stripes
    const stripes = 50;
    const stripeHeight = this.height / stripes;

    for (let i = 0; i < stripes; i++) {
      const t = i / (stripes - 1);
      const color = this.interpolateColor(colors.top, colors.bottom, t);
      this.skyGradient.fillStyle(color, 1);
      this.skyGradient.fillRect(
        this.offsetX,
        this.offsetY + i * stripeHeight,
        this.width,
        stripeHeight + 1
      );
    }
  }

  private updateCloudLayers(hour: number): void {
    // Adjust cloud colors based on time of day
    const isDaytime = hour >= 6 && hour < 20;
    const isNight = hour >= 21 || hour < 5;

    this.cloudLayers.forEach((layer) => {
      layer.graphics.clear();

      layer.clouds.forEach((cloud) => {
        let cloudColor = cloud.color;
        let alpha = layer.alpha;

        if (isNight) {
          // Dark silhouettes at night
          cloudColor = 0x2a2a3a;
          alpha = 0.6;
        } else if (!isDaytime) {
          // Twilight colors
          cloudColor = this.interpolateColor(cloud.color, 0x8a6a8a, 0.4);
        }

        // Draw cloud as soft ellipse
        layer.graphics.fillStyle(cloudColor, alpha);
        layer.graphics.fillEllipse(
          cloud.x + cloud.width / 2,
          cloud.y + cloud.height / 2,
          cloud.width,
          cloud.height
        );

        // Add some smaller cloud puffs for texture
        layer.graphics.fillEllipse(
          cloud.x + cloud.width * 0.3,
          cloud.y + cloud.height * 0.8,
          cloud.width * 0.5,
          cloud.height * 0.6
        );
        layer.graphics.fillEllipse(
          cloud.x + cloud.width * 0.7,
          cloud.y + cloud.height * 0.6,
          cloud.width * 0.4,
          cloud.height * 0.5
        );
      });
    });
  }

  update(hour: number, _cameraX: number): void {
    this.updateSkyGradient(hour);

    // Move clouds with parallax effect
    this.cloudLayers.forEach((layer) => {
      layer.clouds.forEach((cloud) => {
        cloud.x -= layer.speed * 0.5; // Slow drift

        // Wrap clouds when they move off screen
        if (cloud.x + cloud.width < this.offsetX) {
          cloud.x = this.offsetX + this.width;
          cloud.y = this.offsetY + 200 + Math.random() * 800;
        }
      });
    });

    this.updateCloudLayers(hour);
  }

  destroy(): void {
    this.skyGradient.destroy();
    this.cloudLayers.forEach((layer) => layer.graphics.destroy());
  }
}
