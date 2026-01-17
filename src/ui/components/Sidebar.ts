export class Sidebar {
  private element: HTMLDivElement;
  private isCollapsed = false;
  private activeSection: string = 'sector-view';

  constructor(parent: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'sidebar glass-panel';
    this.element.innerHTML = `
      <div class="sidebar-header">
        <div class="brand-header">
          <div class="brand-title">VENUS_OS</div>
          <div class="brand-version">TOWER_04 // ALPHA</div>
        </div>
        <button class="collapse-toggle" aria-label="Toggle sidebar">
          <span class="material-symbols-outlined">chevron_left</span>
        </button>
      </div>
      <div class="sidebar-section">
        <div class="section-header">COMMAND</div>
        <nav class="sidebar-nav">
          <button class="nav-button active" data-section="sector-view">
            <span class="material-symbols-outlined">dashboard</span>
            <span class="nav-label">Sector View</span>
          </button>
          <button class="nav-button" data-section="build-zone">
            <span class="material-symbols-outlined">construction</span>
            <span class="nav-label">Build Zone</span>
          </button>
          <button class="nav-button" data-section="energy-grid">
            <span class="material-symbols-outlined">bolt</span>
            <span class="nav-label">Energy Grid</span>
          </button>
          <button class="nav-button" data-section="economy">
            <span class="material-symbols-outlined">account_balance</span>
            <span class="nav-label">Economy</span>
          </button>
          <button class="nav-button" data-section="heat-map">
            <span class="material-symbols-outlined">layers</span>
            <span class="nav-label">Heat Map</span>
          </button>
          <button class="nav-button" data-section="alerts">
            <span class="material-symbols-outlined">notifications</span>
            <span class="nav-label">Alerts</span>
            <span class="nav-badge">0</span>
          </button>
        </nav>
      </div>
      <div class="sidebar-footer">
        <div class="overseer-profile">
          <div class="overseer-avatar"></div>
          <div class="overseer-info">
            <div class="overseer-name">Overseer</div>
            <div class="overseer-status">Online</div>
          </div>
        </div>
      </div>
    `;

    parent.appendChild(this.element);

    // Setup collapse toggle
    const collapseBtn = this.element.querySelector('.collapse-toggle') as HTMLButtonElement;
    collapseBtn.addEventListener('click', () => this.toggleCollapse());

    // Setup navigation buttons
    const navButtons = this.element.querySelectorAll('.nav-button');
    navButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const section = (btn as HTMLElement).dataset.section;
        if (section) {
          this.setActiveSection(section);
        }
      });
    });
  }

  private toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    this.element.classList.toggle('collapsed', this.isCollapsed);
    
    const icon = this.element.querySelector('.collapse-toggle .material-symbols-outlined') as HTMLElement;
    if (icon) {
      icon.textContent = this.isCollapsed ? 'chevron_right' : 'chevron_left';
    }
  }

  private setActiveSection(section: string): void {
    this.activeSection = section;
    const navButtons = this.element.querySelectorAll('.nav-button');
    navButtons.forEach((btn) => {
      if ((btn as HTMLElement).dataset.section === section) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  getActiveSection(): string {
    return this.activeSection;
  }

  destroy(): void {
    this.element.remove();
  }
}
