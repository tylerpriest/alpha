import { HOURS_PER_DAY, GAME_SPEED, MS_PER_GAME_HOUR } from '../utils/constants';

export class TimeSystem {
  private day = 1;
  private hour = 6; // Start at 6 AM
  private accumulator = 0;
  private _isNewDay = false;

  update(delta: number): void {
    this._isNewDay = false;

    // Accumulate time
    this.accumulator += delta * GAME_SPEED;

    // Convert accumulated time to game hours
    const hoursToAdd = this.accumulator / MS_PER_GAME_HOUR;

    if (hoursToAdd >= 0.01) {
      // Only update if meaningful change
      this.hour += hoursToAdd;
      this.accumulator = 0;

      // Handle day rollover
      while (this.hour >= HOURS_PER_DAY) {
        this.hour -= HOURS_PER_DAY;
        this.day++;
        this._isNewDay = true;
      }
    }
  }

  getDay(): number {
    return this.day;
  }

  getHour(): number {
    return this.hour;
  }

  getFormattedTime(): string {
    const h = Math.floor(this.hour);
    const m = Math.floor((this.hour - h) * 60);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  isNewDay(): boolean {
    return this._isNewDay;
  }

  isWorkHours(): boolean {
    return this.hour >= 9 && this.hour < 17;
  }

  isNightTime(): boolean {
    return this.hour >= 22 || this.hour < 6;
  }

  isDaytime(): boolean {
    return this.hour >= 6 && this.hour < 22;
  }

  setTime(day: number, hour: number): void {
    this.day = day;
    this.hour = hour;
  }
}
