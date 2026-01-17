export class GameOverOverlay {
  private element: HTMLDivElement;
  private onRestart?: () => void;
  private onMainMenu?: () => void;

  constructor(parent: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'game-overlay game-over-overlay';
    this.element.style.display = 'none';
    this.element.innerHTML = `
      <div class="overlay-backdrop"></div>
      <div class="overlay-content glass-panel">
        <div class="overlay-header">
          <h1 class="overlay-title">GAME OVER</h1>
          <div class="overlay-subtitle">Bankruptcy Declared</div>
        </div>
        <div class="overlay-stats">
          <div class="stat-row">
            <span class="stat-label">Cycles Survived:</span>
            <span class="stat-value" data-stat="cycles">0</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Max Population Reached:</span>
            <span class="stat-value" data-stat="maxPopulation">0</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Final Credits:</span>
            <span class="stat-value" data-stat="credits">0</span>
          </div>
        </div>
        <div class="overlay-actions">
          <button class="overlay-btn primary" data-action="restart">Restart</button>
          <button class="overlay-btn secondary" data-action="mainmenu">Main Menu</button>
        </div>
      </div>
    `;

    parent.appendChild(this.element);

    // Wire up buttons
    const restartBtn = this.element.querySelector('[data-action="restart"]') as HTMLButtonElement;
    const mainMenuBtn = this.element.querySelector('[data-action="mainmenu"]') as HTMLButtonElement;

    restartBtn.addEventListener('click', () => {
      this.hide();
      if (this.onRestart) this.onRestart();
    });

    mainMenuBtn.addEventListener('click', () => {
      this.hide();
      if (this.onMainMenu) this.onMainMenu();
    });
  }

  show(cycles: number, maxPopulation: number, credits: number): void {
    const cyclesEl = this.element.querySelector('[data-stat="cycles"]') as HTMLElement;
    const maxPopulationEl = this.element.querySelector('[data-stat="maxPopulation"]') as HTMLElement;
    const creditsEl = this.element.querySelector('[data-stat="credits"]') as HTMLElement;

    if (cyclesEl) cyclesEl.textContent = cycles.toString();
    if (maxPopulationEl) maxPopulationEl.textContent = maxPopulation.toString();
    if (creditsEl) creditsEl.textContent = `${credits.toLocaleString()} CR`;

    this.element.style.display = 'block';
  }

  hide(): void {
    this.element.style.display = 'none';
  }

  setCallbacks(onRestart?: () => void, onMainMenu?: () => void): void {
    this.onRestart = onRestart;
    this.onMainMenu = onMainMenu;
  }

  destroy(): void {
    this.element.remove();
  }
}
