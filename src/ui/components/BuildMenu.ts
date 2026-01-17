import { ROOM_SPECS, RoomType } from '../../utils/constants';

export class BuildMenu {
  private element: HTMLDivElement;
  private buttons: Map<string, HTMLButtonElement> = new Map();
  private onSelect: (roomType: string) => void;

  constructor(parent: HTMLElement, onSelect: (roomType: string) => void) {
    this.onSelect = onSelect;

    this.element = document.createElement('div');
    this.element.className = 'build-menu glass-panel';

    // Create room buttons
    const roomTypes = Object.keys(ROOM_SPECS) as RoomType[];
    roomTypes.forEach((roomType) => {
      const spec = ROOM_SPECS[roomType];
      const button = this.createRoomButton(roomType, spec.cost);
      this.element.appendChild(button);
      this.buttons.set(roomType, button);
    });

    // Add speed controls
    const speedControls = document.createElement('div');
    speedControls.className = 'speed-controls';
    speedControls.innerHTML = `
      <button class="speed-btn" data-speed="0" title="Pause">
        <span class="material-symbols-outlined">pause</span>
      </button>
      <button class="speed-btn active" data-speed="1" title="Normal">1x</button>
      <button class="speed-btn" data-speed="2" title="Fast">2x</button>
      <button class="speed-btn" data-speed="4" title="Very Fast">4x</button>
    `;
    this.element.appendChild(speedControls);

    parent.appendChild(this.element);
  }

  private createRoomButton(roomType: RoomType, cost: number): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = `room-button ${roomType}`;
    button.innerHTML = `
      <div class="room-icon"></div>
      <div class="room-name">${this.capitalize(roomType)}</div>
      <div class="room-cost">${cost === 0 ? 'Free' : `$${cost.toLocaleString()}`}</div>
    `;

    button.addEventListener('click', () => {
      this.onSelect(roomType);
    });

    return button;
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  setSelected(roomType: string): void {
    this.buttons.forEach((button, type) => {
      if (type === roomType) {
        button.classList.add('selected');
      } else {
        button.classList.remove('selected');
      }
    });
  }

  destroy(): void {
    this.element.remove();
  }
}
