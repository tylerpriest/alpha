export class TopBar {
  private element: HTMLDivElement;
  private moneyValue: HTMLSpanElement;
  private foodValue: HTMLSpanElement;
  private populationValue: HTMLSpanElement;
  private starsValue: HTMLSpanElement;
  private satisfactionValue: HTMLSpanElement;
  private dayValue: HTMLSpanElement;
  private timeValue: HTMLSpanElement;
  private onCreditsClick?: () => void;

  constructor(parent: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'top-bar glass-panel';
    this.element.innerHTML = `
      <div class="brand">
        <span class="brand-text">VENUS_OS</span>
        <span class="brand-badge">TOWER_04 // ALPHA</span>
      </div>
      <div class="stats-group">
        <div class="stat money">
          <span class="stat-icon material-symbols-outlined">payments</span>
          <div>
            <div class="stat-value" data-stat="money">20,000 CR</div>
            <div class="stat-label">Credits</div>
          </div>
        </div>
        <div class="stat food">
          <span class="stat-icon material-symbols-outlined">restaurant</span>
          <div>
            <div class="stat-value" data-stat="food">Rations: 0</div>
            <div class="stat-label">Rations</div>
          </div>
        </div>
        <div class="stat population">
          <span class="stat-icon material-symbols-outlined">group</span>
          <div>
            <div class="stat-value" data-stat="population">Residents: 0</div>
            <div class="stat-label">Residents</div>
          </div>
        </div>
        <div class="stat stars">
          <span class="stat-icon material-symbols-outlined">star</span>
          <div>
            <div class="stat-value" data-stat="stars">⭐</div>
            <div class="stat-label">Rating</div>
          </div>
        </div>
        <div class="stat satisfaction">
          <span class="stat-icon material-symbols-outlined">mood</span>
          <div>
            <div class="stat-value" data-stat="satisfaction">—</div>
            <div class="stat-label">Satisfaction</div>
          </div>
        </div>
      </div>
      <div class="time-display">
        <div class="day" data-stat="day">Cycle 1</div>
        <div class="time" data-stat="time">6:00 AM</div>
      </div>
      <div class="top-bar-actions">
        <button class="top-bar-btn" title="Settings" aria-label="Settings">
          <span class="material-symbols-outlined">settings</span>
        </button>
        <button class="top-bar-btn alerts-btn" title="Alerts" aria-label="Alerts">
          <span class="material-symbols-outlined">notifications</span>
          <span class="alerts-badge" style="display: none;">0</span>
        </button>
      </div>
    `;

    parent.appendChild(this.element);

    this.moneyValue = this.element.querySelector('[data-stat="money"]') as HTMLSpanElement;
    this.foodValue = this.element.querySelector('[data-stat="food"]') as HTMLSpanElement;
    this.populationValue = this.element.querySelector('[data-stat="population"]') as HTMLSpanElement;
    this.starsValue = this.element.querySelector('[data-stat="stars"]') as HTMLSpanElement;
    this.satisfactionValue = this.element.querySelector('[data-stat="satisfaction"]') as HTMLSpanElement;
    this.dayValue = this.element.querySelector('[data-stat="day"]') as HTMLSpanElement;
    this.timeValue = this.element.querySelector('[data-stat="time"]') as HTMLSpanElement;

    // Add click handler to Credits stat
    const moneyStat = this.element.querySelector('.stat.money') as HTMLElement;
    moneyStat.style.cursor = 'pointer';
    moneyStat.title = 'Click to view economy breakdown';
    moneyStat.addEventListener('click', () => {
      if (this.onCreditsClick) {
        this.onCreditsClick();
      }
    });
  }

  setOnCreditsClick(callback: () => void): void {
    this.onCreditsClick = callback;
  }

  updateMoney(value: number): void {
    this.moneyValue.textContent = `${value.toLocaleString()} CR`;
    // Change color based on value
    const moneyEl = this.moneyValue.closest('.stat') as HTMLElement;
    if (value < 0) {
      moneyEl.style.setProperty('--stat-color', '#e44a8a');
    } else {
      moneyEl.style.removeProperty('--stat-color');
    }
  }

  updateFood(value: number): void {
    this.foodValue.textContent = `Rations: ${Math.floor(value)}`;
  }

  updatePopulation(value: number): void {
    this.populationValue.textContent = `Residents: ${value}`;
  }

  updateStars(value: number): void {
    const stars = '⭐'.repeat(Math.min(value, 5));
    this.starsValue.textContent = stars || '—';
  }

  updateSatisfaction(value: number | undefined): void {
    if (value === undefined || isNaN(value)) {
      this.satisfactionValue.textContent = '—';
      return;
    }
    
    const rounded = Math.round(value);
    this.satisfactionValue.textContent = `${rounded}/100`;
    
    // Color coding: green ≥80, cyan ≥60, amber ≥40, magenta <40
    const satisfactionEl = this.satisfactionValue.closest('.stat') as HTMLElement;
    if (rounded >= 80) {
      satisfactionEl.style.setProperty('--stat-color', 'var(--green)');
    } else if (rounded >= 60) {
      satisfactionEl.style.setProperty('--stat-color', 'var(--cyan)');
    } else if (rounded >= 40) {
      satisfactionEl.style.setProperty('--stat-color', 'var(--amber)');
    } else {
      satisfactionEl.style.setProperty('--stat-color', 'var(--magenta)');
    }
  }

  updateDay(value: number): void {
    this.dayValue.textContent = `Cycle ${value}`;
  }

  updateTime(value: number): void {
    const hour = Math.floor(value);
    const minute = Math.floor((value - hour) * 60);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    this.timeValue.textContent = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
  }

  destroy(): void {
    this.element.remove();
  }
}
