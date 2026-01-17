import { describe, test, expect, beforeEach } from 'vitest';
import { TimeSystem } from './TimeSystem';
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
});
