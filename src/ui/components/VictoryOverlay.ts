export class VictoryOverlay {
  private element: HTMLDivElement;
  private onContinue?: () => void;
  private onMainMenu?: () => void;

  constructor(parent: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'game-overlay victory-overlay';
    this.element.style.display = 'none';
    this.element.innerHTML = `
      <div class="overlay-backdrop"></div>
      <div class="overlay-content glass-panel">
        <div class="overlay-header">
          <h1 class="overlay-title">VICTORY ACHIEVED</h1>
          <div class="overlay-subtitle">Tower Rating: ⭐⭐</div>
        </div>
        <div class="overlay-stats">
          <div class="stat-row">
            <span class="stat-label">Cycles Survived:</span>
            <span class="stat-value" data-stat="cycles">0</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Final Population:</span>
            <span class="stat-value" data-stat="population">0</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Final Credits:</span>
            <span class="stat-value" data-stat="credits">0</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Rooms Built:</span>
            <span class="stat-value" data-stat="rooms">0</span>
          </div>
        </div>
        <div class="overlay-actions">
          <button class="overlay-btn primary" data-action="continue">Continue Playing</button>
          <button class="overlay-btn secondary" data-action="mainmenu">Main Menu</button>
        </div>
      </div>
    `;

    parent.appendChild(this.element);

    // Wire up buttons
    const continueBtn = this.element.querySelector('[data-action="continue"]') as HTMLButtonElement;
    const mainMenuBtn = this.element.querySelector('[data-action="mainmenu"]') as HTMLButtonElement;

    continueBtn.addEventListener('click', () => {
      this.hide();
      if (this.onContinue) this.onContinue();
    });

    mainMenuBtn.addEventListener('click', () => {
      this.hide();
      if (this.onMainMenu) this.onMainMenu();
    });
  }

  show(cycles: number, population: number, credits: number, rooms: number): void {
    const cyclesEl = this.element.querySelector('[data-stat="cycles"]') as HTMLElement;
    const populationEl = this.element.querySelector('[data-stat="population"]') as HTMLElement;
    const creditsEl = this.element.querySelector('[data-stat="credits"]') as HTMLElement;
    const roomsEl = this.element.querySelector('[data-stat="rooms"]') as HTMLElement;

    if (cyclesEl) cyclesEl.textContent = cycles.toString();
    if (populationEl) populationEl.textContent = population.toString();
    if (creditsEl) creditsEl.textContent = `${credits.toLocaleString()} CR`;
    if (roomsEl) roomsEl.textContent = rooms.toString();

    this.element.style.display = 'block';
  }

  hide(): void {
    this.element.style.display = 'none';
  }

  setCallbacks(onContinue?: () => void, onMainMenu?: () => void): void {
    this.onContinue = onContinue;
    this.onMainMenu = onMainMenu;
  }

  destroy(): void {
    this.element.remove();
  }
}
