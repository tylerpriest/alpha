import Phaser from 'phaser';

interface LavaRiver {
  x: number;
  width: number;
  flowOffset: number;
}

interface AlienFlora {
  x: number;
  type: 'crystal' | 'plant' | 'mushroom';
  height: number;
  color: number;
}

export class VolcanicGround {
  private graphics: Phaser.GameObjects.Graphics;
  private glowGraphics: Phaser.GameObjects.Graphics;
  private lavaRivers: LavaRiver[] = [];
  private flora: AlienFlora[] = [];
  private groundY = 500;
  private width = 3280;
  private offsetX = -1000;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(4);

    this.glowGraphics = scene.add.graphics();
    this.glowGraphics.setDepth(3);
    this.glowGraphics.setBlendMode(Phaser.BlendModes.ADD);

    // Generate lava rivers
    for (let i = 0; i < 6; i++) {
      this.lavaRivers.push({
        x: this.offsetX + 200 + i * 500 + Math.random() * 200,
        width: 30 + Math.random() * 50,
        flowOffset: Math.random() * Math.PI * 2,
      });
    }

    // Generate alien flora
    const floraColors = [0xe44a8a, 0x8a4ae4, 0x4ae4e4, 0xe4a44a];
    for (let i = 0; i < 25; i++) {
      const types: Array<'crystal' | 'plant' | 'mushroom'> = ['crystal', 'plant', 'mushroom'];
      this.flora.push({
        x: this.offsetX + 50 + Math.random() * (this.width - 100),
        type: types[Math.floor(Math.random() * types.length)],
        height: 15 + Math.random() * 35,
        color: floraColors[Math.floor(Math.random() * floraColors.length)],
      });
    }

    this.draw(0);
  }

  draw(time: number): void {
    this.graphics.clear();
    this.glowGraphics.clear();

    // Draw volcanic rock base
    this.graphics.fillStyle(0x2a1a1a, 1);
    this.graphics.fillRect(this.offsetX, this.groundY, this.width, 150);

    // Darker lower layer
    this.graphics.fillStyle(0x1a0a0a, 1);
    this.graphics.fillRect(this.offsetX, this.groundY + 150, this.width, 850);

    // Draw rocky texture
    this.graphics.fillStyle(0x3a2a1a, 0.5);
    for (let i = 0; i < 40; i++) {
      const x = this.offsetX + Math.random() * this.width;
      const y = this.groundY + 10 + Math.random() * 120;
      const w = 20 + Math.random() * 60;
      const h = 10 + Math.random() * 30;
      this.graphics.fillRect(x, y, w, h);
    }

    // Draw lava rivers
    this.lavaRivers.forEach((river) => {
      const flowPulse = Math.sin(time * 0.001 + river.flowOffset) * 0.3 + 0.7;

      // Lava glow (additive)
      this.glowGraphics.fillStyle(0xff4a0a, 0.4 * flowPulse);
      this.glowGraphics.fillRect(
        river.x - 10,
        this.groundY + 30,
        river.width + 20,
        200
      );

      // Bright lava center
      this.graphics.fillStyle(0xff6a1a, flowPulse);
      this.graphics.fillRect(river.x, this.groundY + 40, river.width, 180);

      // Hot white core
      this.graphics.fillStyle(0xffa44a, flowPulse);
      this.graphics.fillRect(
        river.x + river.width * 0.25,
        this.groundY + 50,
        river.width * 0.5,
        160
      );
    });

    // Draw ground line (lava crack glow)
    this.glowGraphics.lineStyle(6, 0xff4a0a, 0.3);
    this.glowGraphics.lineBetween(this.offsetX, this.groundY, this.offsetX + this.width, this.groundY);

    this.graphics.lineStyle(2, 0x4a2a1a, 1);
    this.graphics.lineBetween(this.offsetX, this.groundY, this.offsetX + this.width, this.groundY);

    // Draw alien flora
    this.flora.forEach((plant) => {
      this.drawFlora(plant, time);
    });
  }

  private drawFlora(flora: AlienFlora, time: number): void {
    const sway = Math.sin(time * 0.002 + flora.x * 0.01) * 3;
    const baseY = this.groundY;

    switch (flora.type) {
      case 'crystal':
        // Glowing crystal formation
        this.glowGraphics.fillStyle(flora.color, 0.3);
        this.glowGraphics.fillTriangle(
          flora.x - 8, baseY,
          flora.x + sway, baseY - flora.height,
          flora.x + 8, baseY
        );

        this.graphics.fillStyle(flora.color, 0.8);
        this.graphics.fillTriangle(
          flora.x - 5, baseY,
          flora.x + sway * 0.5, baseY - flora.height + 5,
          flora.x + 5, baseY
        );

        // Crystal highlight
        this.graphics.lineStyle(1, 0xffffff, 0.4);
        this.graphics.lineBetween(
          flora.x + sway * 0.5,
          baseY - flora.height + 5,
          flora.x + 2,
          baseY - flora.height * 0.5
        );
        break;

      case 'plant':
        // Alien plant with tendrils
        this.glowGraphics.lineStyle(4, flora.color, 0.2);
        this.graphics.lineStyle(2, flora.color, 0.7);

        for (let i = 0; i < 3; i++) {
          const tendrilSway = sway * (1 + i * 0.3);
          const tendrilHeight = flora.height * (0.6 + i * 0.2);
          const offsetX = (i - 1) * 6;

          this.glowGraphics.lineBetween(
            flora.x + offsetX,
            baseY,
            flora.x + offsetX + tendrilSway,
            baseY - tendrilHeight
          );
          this.graphics.lineBetween(
            flora.x + offsetX,
            baseY,
            flora.x + offsetX + tendrilSway,
            baseY - tendrilHeight
          );

          // Bulb at top
          this.graphics.fillStyle(flora.color, 0.9);
          this.graphics.fillCircle(
            flora.x + offsetX + tendrilSway,
            baseY - tendrilHeight,
            3 + i
          );
        }
        break;

      case 'mushroom': {
        // Glowing mushroom
        const capRadius = 8 + flora.height * 0.2;

        // Stem
        this.graphics.fillStyle(0x3a2a3a, 0.8);
        this.graphics.fillRect(
          flora.x - 3,
          baseY - flora.height + capRadius,
          6,
          flora.height - capRadius
        );

        // Cap glow
        this.glowGraphics.fillStyle(flora.color, 0.4);
        this.glowGraphics.fillEllipse(
          flora.x + sway * 0.5,
          baseY - flora.height,
          capRadius * 2.5,
          capRadius * 1.2
        );

        // Cap
        this.graphics.fillStyle(flora.color, 0.8);
        this.graphics.fillEllipse(
          flora.x + sway * 0.5,
          baseY - flora.height,
          capRadius * 2,
          capRadius
        );

        // Spots
        this.graphics.fillStyle(0xffffff, 0.3);
        this.graphics.fillCircle(
          flora.x + sway * 0.5 - 4,
          baseY - flora.height - 2,
          2
        );
        this.graphics.fillCircle(
          flora.x + sway * 0.5 + 3,
          baseY - flora.height + 1,
          1.5
        );
        break;
      }
    }
  }

  update(time: number): void {
    this.draw(time);
  }

  destroy(): void {
    this.graphics.destroy();
    this.glowGraphics.destroy();
  }
}
