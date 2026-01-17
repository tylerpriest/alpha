import { describe, test, expect, beforeEach } from 'vitest';
import { EconomySystem } from './EconomySystem';

describe('EconomySystem', () => {
  let economy: EconomySystem;

  beforeEach(() => {
    economy = new EconomySystem(10000);
  });

  test('initializes with correct money', () => {
    expect(economy.getMoney()).toBe(10000);
  });

  test('canAfford returns true when enough money', () => {
    expect(economy.canAfford(5000)).toBe(true);
    expect(economy.canAfford(10000)).toBe(true);
    expect(economy.canAfford(10001)).toBe(false);
  });

  test('spend deducts money when affordable', () => {
    const success = economy.spend(3000);
    expect(success).toBe(true);
    expect(economy.getMoney()).toBe(7000);
  });

  test('spend fails when not enough money', () => {
    const success = economy.spend(15000);
    expect(success).toBe(false);
    expect(economy.getMoney()).toBe(10000);
  });

  test('earn adds money', () => {
    economy.earn(5000);
    expect(economy.getMoney()).toBe(15000);
  });

  test('isBankrupt returns true when deeply in debt', () => {
    economy.setMoney(-15000);
    expect(economy.isBankrupt()).toBe(true);
  });

  test('isBankrupt returns false when solvent or in minor debt', () => {
    expect(economy.isBankrupt()).toBe(false);
    economy.setMoney(-5000);
    expect(economy.isBankrupt()).toBe(false);
  });

  test('getSnapshot returns correct data', () => {
    const snapshot = economy.getSnapshot();
    expect(snapshot.money).toBe(10000);
    expect(snapshot.dailyIncome).toBe(0);
    expect(snapshot.dailyExpenses).toBe(0);
  });
});
