import Phaser from 'phaser';
import { HOURS_PER_DAY, MS_PER_GAME_HOUR } from '../utils/constants';

export enum DayOfWeek {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
}

export enum DayPhase {
  Night, // 10 PM - 5 AM
  Dawn, // 5 AM - 7 AM
  Day, // 7 AM - 6 PM
  Dusk, // 6 PM - 8 PM
  Evening, // 8 PM - 10 PM
}

export class TimeSystem extends Phaser.Events.EventEmitter {
  private day = 1;
  private hour = 6; // Start at 6 AM
  private minute = 0; // Minutes (0-59)
  private dayOfWeek: DayOfWeek = DayOfWeek.Monday; // Start on Monday
  private accumulator = 0;
  private _isNewDay = false;
  private _isPaused = false;
  private _speed = 1; // 1 = normal, 2 = fast, 4 = very fast, 0 = paused
  private previousDay = 1;
  private previousPhase: DayPhase = DayPhase.Dawn;

  update(delta: number): void {
    this._isNewDay = false;

    // Skip time accumulation if paused
    if (this._isPaused || this._speed === 0) {
      return;
    }

    // Accumulate time with speed multiplier
    this.accumulator += delta * this._speed;

    // Convert accumulated time to game hours
    const hoursToAdd = this.accumulator / MS_PER_GAME_HOUR;

    if (hoursToAdd >= 0.01) {
      // Only update if meaningful change
      const previousHourInt = Math.floor(this.hour);
      this.hour += hoursToAdd;
      this.accumulator = 0;

      // Update minute
      this.minute = Math.floor((this.hour - Math.floor(this.hour)) * 60);

      // Handle day rollover
      while (this.hour >= HOURS_PER_DAY) {
        this.hour -= HOURS_PER_DAY;
        this.day++;
        this.dayOfWeek = (this.dayOfWeek + 1) % 7;
        this._isNewDay = true;
      }

      // Check for hour change
      const currentHourInt = Math.floor(this.hour);
      if (currentHourInt !== previousHourInt) {
        this.emit('time:hour-changed', {
          hour: currentHourInt,
          previousHour: previousHourInt,
          minute: this.minute,
        });
        // Hour changed - events emitted above

        // Check for schedule events
        this.checkScheduleEvents(currentHourInt);
      }

      // Check for day change
      if (this._isNewDay && this.day !== this.previousDay) {
        this.emit('time:day-changed', {
          dayOfWeek: this.dayOfWeek,
          totalDays: this.day,
          previousDay: this.previousDay,
        });
        this.previousDay = this.day;
      }

      // Check for phase change
      const currentPhase = this.getDayPhase();
      if (currentPhase !== this.previousPhase) {
        this.emit('time:phase-changed', {
          phase: currentPhase,
          previousPhase: this.previousPhase,
        });
        this.previousPhase = currentPhase;
      }
    }
  }

  private checkScheduleEvents(hour: number): void {
    // Wake up at 6 AM
    if (hour === 6) {
      this.emit('schedule:wake-up');
    }

    // Work start at 9 AM (weekdays only)
    if (hour === 9 && !this.isWeekend()) {
      this.emit('schedule:work-start');
    }

    // Lunch start at 12 PM
    if (hour === 12) {
      this.emit('schedule:lunch-start');
    }

    // Lunch end at 1 PM
    if (hour === 13) {
      this.emit('schedule:lunch-end');
    }

    // Work end at 5 PM (weekdays only)
    if (hour === 17 && !this.isWeekend()) {
      this.emit('schedule:work-end');
    }

    // Sleep at 10 PM
    if (hour === 22) {
      this.emit('schedule:sleep');
    }
  }

  getDayPhase(): DayPhase {
    const h = Math.floor(this.hour);
    if (h >= 22 || h < 5) {
      return DayPhase.Night;
    } else if (h >= 5 && h < 7) {
      return DayPhase.Dawn;
    } else if (h >= 7 && h < 18) {
      return DayPhase.Day;
    } else if (h >= 18 && h < 20) {
      return DayPhase.Dusk;
    } else {
      return DayPhase.Evening;
    }
  }

  getDay(): number {
    return this.day;
  }

  getHour(): number {
    return this.hour;
  }

  getMinute(): number {
    return this.minute;
  }

  getDayOfWeek(): DayOfWeek {
    return this.dayOfWeek;
  }

  isWeekend(): boolean {
    return this.dayOfWeek === DayOfWeek.Saturday || this.dayOfWeek === DayOfWeek.Sunday;
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

  setTime(day: number, hour: number, dayOfWeek?: DayOfWeek): void {
    this.day = day;
    this.hour = hour;
    this.minute = Math.floor((hour - Math.floor(hour)) * 60);
    if (dayOfWeek !== undefined) {
      this.dayOfWeek = dayOfWeek;
    } else {
      // Calculate day of week from day number (day 1 is Monday = 1)
      // Formula: ((day - 1) % 7 + 1) % 7
      // Day 1 -> 0 -> 1 (Monday)
      // Day 7 -> 6 -> 7 -> 0 (Sunday)
      const calculated = (((day - 1) % 7) + 1) % 7;
      this.dayOfWeek = calculated as DayOfWeek;
    }
    // Time set - previous hour tracking not needed
    this.previousDay = day;
    this.previousPhase = this.getDayPhase();
  }

  isPaused(): boolean {
    return this._isPaused || this._speed === 0;
  }

  setPaused(paused: boolean): void {
    this._isPaused = paused;
  }

  togglePause(): void {
    this._isPaused = !this._isPaused;
  }

  getSpeed(): number {
    return this._speed;
  }

  setSpeed(speed: number): void {
    const previousSpeed = this._speed;
    this._speed = speed;
    // If speed is set to 0, pause; if set to non-zero, unpause
    if (speed === 0) {
      this._isPaused = true;
    } else {
      this._isPaused = false;
    }
    if (speed !== previousSpeed) {
      this.emit('time:speed-changed', {
        speed,
        previousSpeed,
      });
    }
  }
}
