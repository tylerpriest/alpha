import { ROOM_SPECS, RoomType } from '../../utils/constants';

export class RoomInfoPanel {
  private element: HTMLDivElement;
  private roomId: string | null = null;

  constructor(parent: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'room-info-panel glass-panel';
    this.element.style.display = 'none';
    parent.appendChild(this.element);
  }

  show(roomId: string, roomType: RoomType, residents: number, workers: number, income: number, expenses: number): void {
    this.roomId = roomId;
    const spec = ROOM_SPECS[roomType];
    
    const displayName = roomType.charAt(0).toUpperCase() + roomType.slice(1);
    const netIncome = income - expenses;

    this.element.innerHTML = `
      <div class="room-info-header">
        <div class="room-info-title">${displayName}</div>
        <button class="room-info-close" aria-label="Close">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="room-info-content">
        <div class="room-info-row">
          <span class="room-info-label">ID:</span>
          <span class="room-info-value">${roomId.slice(0, 8)}</span>
        </div>
        ${'capacity' in spec ? `
        <div class="room-info-row">
          <span class="room-info-label">Residents:</span>
          <span class="room-info-value">${residents} / ${spec.capacity}</span>
        </div>
        ` : ''}
        ${'jobs' in spec ? `
        <div class="room-info-row">
          <span class="room-info-label">Workers:</span>
          <span class="room-info-value">${workers} / ${spec.jobs}</span>
        </div>
        ` : ''}
        <div class="room-info-row">
          <span class="room-info-label">Income:</span>
          <span class="room-info-value" style="color: var(--green);">+${income.toLocaleString()} CR/day</span>
        </div>
        <div class="room-info-row">
          <span class="room-info-label">Expenses:</span>
          <span class="room-info-value" style="color: var(--magenta);">-${expenses.toLocaleString()} CR/day</span>
        </div>
        <div class="room-info-row">
          <span class="room-info-label">Net:</span>
          <span class="room-info-value" style="color: ${netIncome >= 0 ? 'var(--green)' : 'var(--magenta)'};">
            ${netIncome >= 0 ? '+' : ''}${netIncome.toLocaleString()} CR/day
          </span>
        </div>
      </div>
    `;

    this.element.style.display = 'block';

    // Close button handler
    const closeBtn = this.element.querySelector('.room-info-close') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => {
      this.hide();
    });
  }

  hide(): void {
    this.element.style.display = 'none';
    this.roomId = null;
  }

  isVisible(): boolean {
    return this.element.style.display !== 'none';
  }

  getRoomId(): string | null {
    return this.roomId;
  }

  destroy(): void {
    this.element.remove();
  }
}
