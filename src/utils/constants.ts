// Grid and display
export const GRID_SIZE = 64;
export const FLOOR_HEIGHT = GRID_SIZE;

// Economy
export const INITIAL_MONEY = 20000;

// Time
export const HOURS_PER_DAY = 24;
export const GAME_SPEED = 1; // 1 = normal, 2 = fast, etc.
export const MS_PER_GAME_HOUR = 10000; // 10 seconds = 1 game hour at normal speed

// Resident needs
export const HUNGER_DECAY_RATE = 4; // Per game hour
export const HUNGER_CRITICAL = 20;
export const HUNGER_MAX = 100;
export const FOOD_PER_MEAL = 30;

// Room specifications
export const ROOM_SPECS = {
  lobby: {
    width: 20, // Grid units
    cost: 0,
    minFloor: 0,
    maxFloor: 0,
    color: 0x4a4a6a,
    income: 0,
    expenses: 0,
  },
  apartment: {
    width: 3,
    cost: 5000,
    minFloor: 1,
    maxFloor: 100,
    color: 0x6a8a4a,
    income: 100, // Rent per day
    expenses: 10, // Maintenance per day
    capacity: 2, // Residents
  },
  office: {
    width: 4,
    cost: 8000,
    minFloor: 1,
    maxFloor: 100,
    color: 0x4a6a8a,
    income: 200, // Per employed resident per day
    expenses: 20,
    jobs: 4, // Number of jobs
  },
  farm: {
    width: 4,
    cost: 15000,
    minFloor: 1,
    maxFloor: 100,
    color: 0x8a6a4a,
    income: 0,
    expenses: 50,
    foodProduction: 10, // Per day
  },
  kitchen: {
    width: 3,
    cost: 10000,
    minFloor: 1,
    maxFloor: 100,
    color: 0x8a4a4a,
    income: 0,
    expenses: 30,
    foodProcessing: 20, // Converts raw food to meals per day
  },
} as const;

export type RoomType = keyof typeof ROOM_SPECS;
