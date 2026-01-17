import { describe, test, expect, beforeEach, vi } from 'vitest';
import { TimeSystem, DayOfWeek, DayPhase } from './TimeSystem';
import { MS_PER_GAME_HOUR } from '../utils/constants';

describe('TimeSystem', () => {
  let time: TimeSystem;

  beforeEach(() => {
    time = new TimeSystem();
  });

  test('initializes at day 1, 6 AM', () => {
    expect(time.getDay()).toBe(1);
    expect(time.getHour()).toBe(6);
  });

  test('advances time correctly', () => {
    // Advance 2 game hours
    time.update(MS_PER_GAME_HOUR * 2);
    expect(time.getHour()).toBeCloseTo(8, 1);
  });

  test('handles day rollover', () => {
    // Advance 20 hours (from 6 AM to 2 AM next day)
    time.update(MS_PER_GAME_HOUR * 20);
    expect(time.getDay()).toBe(2);
    expect(time.getHour()).toBeCloseTo(2, 1);
  });

  test('isNewDay returns true after day rollover', () => {
    expect(time.isNewDay()).toBe(false);

    // Advance to next day
    time.update(MS_PER_GAME_HOUR * 20);
    expect(time.isNewDay()).toBe(true);

    // Next update should reset
    time.update(MS_PER_GAME_HOUR * 0.1);
    expect(time.isNewDay()).toBe(false);
  });

  test('isWorkHours returns correct values', () => {
    // 6 AM - not work hours
    expect(time.isWorkHours()).toBe(false);

    // Advance to 10 AM
    time.update(MS_PER_GAME_HOUR * 4);
    expect(time.isWorkHours()).toBe(true);

    // Advance to 6 PM
    time.update(MS_PER_GAME_HOUR * 8);
    expect(time.isWorkHours()).toBe(false);
  });

  test('isNightTime returns correct values', () => {
    // 6 AM - not night
    expect(time.isNightTime()).toBe(false);

    // Advance to 11 PM
    time.update(MS_PER_GAME_HOUR * 17);
    expect(time.isNightTime()).toBe(true);
  });

  test('setTime works correctly', () => {
    time.setTime(5, 14);
    expect(time.getDay()).toBe(5);
    expect(time.getHour()).toBe(14);
  });

  test('pause stops time advancement', () => {
    const initialHour = time.getHour();
    time.setPaused(true);
    time.update(MS_PER_GAME_HOUR * 2);
    expect(time.getHour()).toBeCloseTo(initialHour, 1);
    expect(time.isPaused()).toBe(true);
  });

  test('setSpeed controls time advancement rate', () => {
    const initialHour = time.getHour();
    
    // Normal speed (1x)
    time.setSpeed(1);
    time.update(MS_PER_GAME_HOUR);
    expect(time.getHour()).toBeCloseTo(initialHour + 1, 1);
    
    // Fast speed (2x)
    time.setTime(1, 6);
    time.setSpeed(2);
    time.update(MS_PER_GAME_HOUR);
    expect(time.getHour()).toBeCloseTo(7, 1); // Should advance 2 hours
    
    // Very fast speed (4x)
    time.setTime(1, 6);
    time.setSpeed(4);
    time.update(MS_PER_GAME_HOUR);
    expect(time.getHour()).toBeCloseTo(8, 1); // Should advance 4 hours
  });

  test('setSpeed to 0 pauses time', () => {
    time.setSpeed(0);
    expect(time.isPaused()).toBe(true);
    
    const initialHour = time.getHour();
    time.update(MS_PER_GAME_HOUR * 2);
    expect(time.getHour()).toBeCloseTo(initialHour, 1);
  });

  test('togglePause works correctly', () => {
    expect(time.isPaused()).toBe(false);
    time.togglePause();
    expect(time.isPaused()).toBe(true);
    time.togglePause();
    expect(time.isPaused()).toBe(false);
  });

  test('getSpeed returns current speed', () => {
    expect(time.getSpeed()).toBe(1); // Default
    time.setSpeed(2);
    expect(time.getSpeed()).toBe(2);
    time.setSpeed(4);
    expect(time.getSpeed()).toBe(4);
  });

  test('tracks day of week correctly', () => {
    // Starts on Monday (day 1)
    expect(time.getDayOfWeek()).toBe(DayOfWeek.Monday);
    
    // Advance to next day (Tuesday)
    time.update(MS_PER_GAME_HOUR * 18);
    expect(time.getDayOfWeek()).toBe(DayOfWeek.Tuesday);
    
    // Advance 6 more days to Sunday
    time.setTime(7, 6);
    expect(time.getDayOfWeek()).toBe(DayOfWeek.Sunday);
  });

  test('isWeekend returns true for Saturday and Sunday', () => {
    // Monday - not weekend
    expect(time.isWeekend()).toBe(false);
    
    // Set to Saturday
    time.setTime(6, 12, DayOfWeek.Saturday);
    expect(time.isWeekend()).toBe(true);
    
    // Set to Sunday
    time.setTime(7, 12, DayOfWeek.Sunday);
    expect(time.isWeekend()).toBe(true);
  });

  test('tracks minutes correctly', () => {
    expect(time.getMinute()).toBe(0);
    
    // Advance 30 minutes (0.5 hours)
    time.update(MS_PER_GAME_HOUR * 0.5);
    expect(time.getMinute()).toBe(30);
    
    // Advance another 45 minutes (0.75 hours)
    time.update(MS_PER_GAME_HOUR * 0.75);
    expect(time.getMinute()).toBe(15); // 30 + 45 = 75 minutes = 1 hour 15 minutes
  });

  test('emits time:hour-changed event', () => {
    const handler = vi.fn();
    time.on('time:hour-changed', handler);
    
    // Advance from 6 AM to 7 AM
    time.update(MS_PER_GAME_HOUR);
    
    expect(handler).toHaveBeenCalledWith({
      hour: 7,
      previousHour: 6,
      minute: expect.any(Number),
    });
  });

  test('emits time:day-changed event', () => {
    const handler = vi.fn();
    time.on('time:day-changed', handler);
    
    // Advance 20 hours to trigger day rollover
    time.update(MS_PER_GAME_HOUR * 20);
    
    expect(handler).toHaveBeenCalledWith({
      dayOfWeek: DayOfWeek.Tuesday,
      totalDays: 2,
      previousDay: 1,
    });
  });

  test('emits time:phase-changed event', () => {
    const handler = vi.fn();
    time.on('time:phase-changed', handler);
    
    // Start at 6 AM (Dawn)
    expect(time.getDayPhase()).toBe(DayPhase.Dawn);
    
    // Advance to 7 AM (Day)
    time.update(MS_PER_GAME_HOUR);
    
    expect(handler).toHaveBeenCalledWith({
      phase: DayPhase.Day,
      previousPhase: DayPhase.Dawn,
    });
  });

  test('emits time:speed-changed event', () => {
    const handler = vi.fn();
    time.on('time:speed-changed', handler);
    
    time.setSpeed(2);
    
    expect(handler).toHaveBeenCalledWith({
      speed: 2,
      previousSpeed: 1,
    });
  });

  test('emits schedule:wake-up at 6 AM', () => {
    const handler = vi.fn();
    time.on('schedule:wake-up', handler);
    
    // Set to 5:59 AM and advance to 6 AM
    time.setTime(1, 5.99);
    time.update(MS_PER_GAME_HOUR * 0.02);
    
    expect(handler).toHaveBeenCalled();
  });

  test('emits schedule:work-start at 9 AM on weekdays only', () => {
    const handler = vi.fn();
    time.on('schedule:work-start', handler);
    
    // Monday 8:59 AM -> 9 AM
    time.setTime(1, 8.99, DayOfWeek.Monday);
    time.update(MS_PER_GAME_HOUR * 0.02);
    expect(handler).toHaveBeenCalled();
    
    // Saturday 8:59 AM -> 9 AM (should not emit)
    handler.mockClear();
    time.setTime(6, 8.99, DayOfWeek.Saturday);
    time.update(MS_PER_GAME_HOUR * 0.02);
    expect(handler).not.toHaveBeenCalled();
  });

  test('emits schedule:lunch-start at 12 PM', () => {
    const handler = vi.fn();
    time.on('schedule:lunch-start', handler);
    
    time.setTime(1, 11.99);
    time.update(MS_PER_GAME_HOUR * 0.02);
    
    expect(handler).toHaveBeenCalled();
  });

  test('emits schedule:lunch-end at 1 PM', () => {
    const handler = vi.fn();
    time.on('schedule:lunch-end', handler);
    
    time.setTime(1, 12.99);
    time.update(MS_PER_GAME_HOUR * 0.02);
    
    expect(handler).toHaveBeenCalled();
  });

  test('emits schedule:work-end at 5 PM on weekdays only', () => {
    const handler = vi.fn();
    time.on('schedule:work-end', handler);
    
    // Monday 4:59 PM -> 5 PM
    time.setTime(1, 16.99, DayOfWeek.Monday);
    time.update(MS_PER_GAME_HOUR * 0.02);
    expect(handler).toHaveBeenCalled();
    
    // Sunday 4:59 PM -> 5 PM (should not emit)
    handler.mockClear();
    time.setTime(7, 16.99, DayOfWeek.Sunday);
    time.update(MS_PER_GAME_HOUR * 0.02);
    expect(handler).not.toHaveBeenCalled();
  });

  test('emits schedule:sleep at 10 PM', () => {
    const handler = vi.fn();
    time.on('schedule:sleep', handler);
    
    time.setTime(1, 21.99);
    time.update(MS_PER_GAME_HOUR * 0.02);
    
    expect(handler).toHaveBeenCalled();
  });

  test('getDayPhase returns correct phases', () => {
    // Night: 10 PM - 5 AM
    time.setTime(1, 23);
    expect(time.getDayPhase()).toBe(DayPhase.Night);
    time.setTime(1, 2);
    expect(time.getDayPhase()).toBe(DayPhase.Night);
    
    // Dawn: 5 AM - 7 AM
    time.setTime(1, 6);
    expect(time.getDayPhase()).toBe(DayPhase.Dawn);
    
    // Day: 7 AM - 6 PM
    time.setTime(1, 12);
    expect(time.getDayPhase()).toBe(DayPhase.Day);
    
    // Dusk: 6 PM - 8 PM
    time.setTime(1, 19);
    expect(time.getDayPhase()).toBe(DayPhase.Dusk);
    
    // Evening: 8 PM - 10 PM
    time.setTime(1, 21);
    expect(time.getDayPhase()).toBe(DayPhase.Evening);
  });
});
