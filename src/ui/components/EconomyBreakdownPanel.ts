export interface IncomeBreakdown {
  apartmentRent: number;
  officeIncome: number;
  restaurantIncome: number;
  quarterlyRevenue: number;
  total: number;
}

export interface ExpenseBreakdown {
  apartment: number;
  office: number;
  farm: number;
  kitchen: number;
  fastfood: number;
  restaurant: number;
  total: number;
}

export class EconomyBreakdownPanel {
  private element: HTMLDivElement;

  constructor(parent: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'economy-breakdown-panel glass-panel';
    this.element.style.display = 'none';
    parent.appendChild(this.element);
  }

  show(
    incomeBreakdown: IncomeBreakdown,
    expenseBreakdown: ExpenseBreakdown,
    currentMoney: number,
    quarterlyRevenue: number,
    lastQuarterDay: number,
    currentDay: number,
    averageSatisfaction?: number
  ): void {
    const netDaily = incomeBreakdown.total - expenseBreakdown.total;
    const daysUntilQuarter = Math.max(0, 90 - (currentDay - lastQuarterDay));
    const avgQuarterlyPerDay = quarterlyRevenue > 0 ? quarterlyRevenue / 90 : 0;

    this.element.innerHTML = `
      <div class="economy-breakdown-header">
        <div class="economy-breakdown-title">Economy Breakdown</div>
        <button class="economy-breakdown-close" aria-label="Close">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="economy-breakdown-content">
        <div class="economy-section">
          <div class="economy-section-title">Current Balance</div>
          <div class="economy-balance" style="color: ${currentMoney >= 0 ? 'var(--green)' : 'var(--magenta)'};">
            ${currentMoney.toLocaleString()} CR
          </div>
        </div>

        ${averageSatisfaction !== undefined ? `
        <div class="economy-section">
          <div class="economy-section-title">Building Satisfaction</div>
          <div class="economy-breakdown-row">
            <span class="economy-breakdown-label">Average Satisfaction:</span>
            <span class="economy-breakdown-value" style="color: ${averageSatisfaction >= 80 ? 'var(--green)' : averageSatisfaction >= 60 ? 'var(--cyan)' : averageSatisfaction >= 40 ? 'var(--amber)' : 'var(--magenta)'};">
              ${Math.round(averageSatisfaction)}/100
            </span>
          </div>
        </div>
        ` : ''}

        <div class="economy-section">
          <div class="economy-section-title">Daily Income</div>
          <div class="economy-breakdown-list">
            <div class="economy-breakdown-row">
              <span class="economy-breakdown-label">Apartment Rent:</span>
              <span class="economy-breakdown-value" style="color: var(--green);">
                +${incomeBreakdown.apartmentRent.toLocaleString()} CR
              </span>
            </div>
            <div class="economy-breakdown-row">
              <span class="economy-breakdown-label">Office Income:</span>
              <span class="economy-breakdown-value" style="color: var(--green);">
                +${incomeBreakdown.officeIncome.toLocaleString()} CR
              </span>
            </div>
            <div class="economy-breakdown-row">
              <span class="economy-breakdown-label">Restaurant Income:</span>
              <span class="economy-breakdown-value" style="color: var(--green);">
                +${incomeBreakdown.restaurantIncome.toLocaleString()} CR
              </span>
            </div>
            ${avgQuarterlyPerDay > 0 ? `
            <div class="economy-breakdown-row">
              <span class="economy-breakdown-label">Quarterly Revenue (avg/day):</span>
              <span class="economy-breakdown-value" style="color: var(--cyan);">
                +${avgQuarterlyPerDay.toFixed(0)} CR
              </span>
            </div>
            ` : ''}
            <div class="economy-breakdown-row economy-breakdown-total">
              <span class="economy-breakdown-label">Total Daily Income:</span>
              <span class="economy-breakdown-value" style="color: var(--green);">
                +${incomeBreakdown.total.toLocaleString()} CR
              </span>
            </div>
          </div>
        </div>

        <div class="economy-section">
          <div class="economy-section-title">Daily Expenses</div>
          <div class="economy-breakdown-list">
            ${expenseBreakdown.apartment > 0 ? `
            <div class="economy-breakdown-row">
              <span class="economy-breakdown-label">Apartments:</span>
              <span class="economy-breakdown-value" style="color: var(--magenta);">
                -${expenseBreakdown.apartment.toLocaleString()} CR
              </span>
            </div>
            ` : ''}
            ${expenseBreakdown.office > 0 ? `
            <div class="economy-breakdown-row">
              <span class="economy-breakdown-label">Offices:</span>
              <span class="economy-breakdown-value" style="color: var(--magenta);">
                -${expenseBreakdown.office.toLocaleString()} CR
              </span>
            </div>
            ` : ''}
            ${expenseBreakdown.farm > 0 ? `
            <div class="economy-breakdown-row">
              <span class="economy-breakdown-label">Farms:</span>
              <span class="economy-breakdown-value" style="color: var(--magenta);">
                -${expenseBreakdown.farm.toLocaleString()} CR
              </span>
            </div>
            ` : ''}
            ${expenseBreakdown.kitchen > 0 ? `
            <div class="economy-breakdown-row">
              <span class="economy-breakdown-label">Kitchens:</span>
              <span class="economy-breakdown-value" style="color: var(--magenta);">
                -${expenseBreakdown.kitchen.toLocaleString()} CR
              </span>
            </div>
            ` : ''}
            ${expenseBreakdown.fastfood > 0 ? `
            <div class="economy-breakdown-row">
              <span class="economy-breakdown-label">Fast Food:</span>
              <span class="economy-breakdown-value" style="color: var(--magenta);">
                -${expenseBreakdown.fastfood.toLocaleString()} CR
              </span>
            </div>
            ` : ''}
            ${expenseBreakdown.restaurant > 0 ? `
            <div class="economy-breakdown-row">
              <span class="economy-breakdown-label">Restaurants:</span>
              <span class="economy-breakdown-value" style="color: var(--magenta);">
                -${expenseBreakdown.restaurant.toLocaleString()} CR
              </span>
            </div>
            ` : ''}
            <div class="economy-breakdown-row economy-breakdown-total">
              <span class="economy-breakdown-label">Total Daily Expenses:</span>
              <span class="economy-breakdown-value" style="color: var(--magenta);">
                -${expenseBreakdown.total.toLocaleString()} CR
              </span>
            </div>
          </div>
        </div>

        <div class="economy-section">
          <div class="economy-section-title">Net Daily Balance</div>
          <div class="economy-net-balance" style="color: ${netDaily >= 0 ? 'var(--green)' : 'var(--magenta)'};">
            ${netDaily >= 0 ? '+' : ''}${netDaily.toLocaleString()} CR/day
          </div>
        </div>

        ${quarterlyRevenue > 0 ? `
        <div class="economy-section">
          <div class="economy-section-title">Quarterly Revenue</div>
          <div class="economy-breakdown-info">
            <div class="economy-breakdown-row">
              <span class="economy-breakdown-label">Last Quarter Bonus:</span>
              <span class="economy-breakdown-value" style="color: var(--cyan);">
                +${quarterlyRevenue.toLocaleString()} CR
              </span>
            </div>
            <div class="economy-breakdown-row">
              <span class="economy-breakdown-label">Next Quarter:</span>
              <span class="economy-breakdown-value">
                ${daysUntilQuarter} days
              </span>
            </div>
          </div>
        </div>
        ` : ''}
      </div>
    `;

    this.element.style.display = 'block';

    // Close button handler
    const closeBtn = this.element.querySelector('.economy-breakdown-close') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => {
      this.hide();
    });
  }

  hide(): void {
    this.element.style.display = 'none';
  }

  isVisible(): boolean {
    return this.element.style.display !== 'none';
  }

  destroy(): void {
    this.element.remove();
  }
}
