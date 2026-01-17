/**
 * Notification Component
 * 
 * Displays temporary toast notifications for important game events
 * (e.g., quarterly revenue received, low rations warning, etc.)
 */

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export class Notification {
  private container: HTMLDivElement;
  private notifications: Map<string, HTMLDivElement> = new Map();
  private notificationIdCounter = 0;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.className = 'notification-container';
    this.container.setAttribute('aria-live', 'polite');
    this.container.setAttribute('aria-atomic', 'true');
    parent.appendChild(this.container);
  }

  /**
   * Show a notification
   * @param message The message to display
   * @param type Notification type (success, info, warning, error)
   * @param duration Duration in milliseconds (default: 5000)
   * @returns Notification ID (can be used to dismiss manually)
   */
  show(message: string, type: NotificationType = 'info', duration: number = 5000): string {
    const id = `notification-${this.notificationIdCounter++}`;
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('data-notification-id', id);

    // Icon based on type
    let icon = 'info';
    if (type === 'success') icon = 'check_circle';
    else if (type === 'warning') icon = 'warning';
    else if (type === 'error') icon = 'error';

    notification.innerHTML = `
      <span class="notification-icon material-symbols-outlined">${icon}</span>
      <span class="notification-message">${message}</span>
      <button class="notification-close" aria-label="Close notification">
        <span class="material-symbols-outlined">close</span>
      </button>
    `;

    // Close button handler
    const closeBtn = notification.querySelector('.notification-close') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => {
      this.dismiss(id);
    });

    this.container.appendChild(notification);
    this.notifications.set(id, notification);

    // Trigger animation
    requestAnimationFrame(() => {
      notification.classList.add('notification-visible');
    });

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  /**
   * Dismiss a specific notification
   */
  dismiss(id: string): void {
    const notification = this.notifications.get(id);
    if (!notification) return;

    notification.classList.remove('notification-visible');
    notification.classList.add('notification-dismissing');

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      this.notifications.delete(id);
    }, 300); // Match CSS transition duration
  }

  /**
   * Dismiss all notifications
   */
  dismissAll(): void {
    const ids = Array.from(this.notifications.keys());
    ids.forEach(id => this.dismiss(id));
  }

  /**
   * Show a success notification (e.g., quarterly revenue)
   */
  showSuccess(message: string, duration?: number): string {
    return this.show(message, 'success', duration);
  }

  /**
   * Show an info notification
   */
  showInfo(message: string, duration?: number): string {
    return this.show(message, 'info', duration);
  }

  /**
   * Show a warning notification
   */
  showWarning(message: string, duration?: number): string {
    return this.show(message, 'warning', duration);
  }

  /**
   * Show an error notification
   */
  showError(message: string, duration?: number): string {
    return this.show(message, 'error', duration);
  }

  destroy(): void {
    this.dismissAll();
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
