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

// Room color specifications (Cyberpunk Venus palette - dark bases, bright neon)
export const ROOM_COLORS = {
  lobby: { base: 0x1a2a2a, accent: 0x4ae4e4 },     // Very dark teal + Bright cyan
  apartment: { base: 0x2a2420, accent: 0xe4a44a }, // Dark brown + Warm orange
  office: { base: 0x1a2028, accent: 0x4a8ae4 },    // Dark blue-gray + Blue
  farm: { base: 0x1a2018, accent: 0x4ae44a },      // Dark green-brown + Bright green
  kitchen: { base: 0x201a1a, accent: 0xe4d4a4 },   // Dark warm gray + Warm yellow
} as const;

// UI Colors
export const UI_COLORS = {
  validPlacement: 0x4ae4e4,   // Cyan glow
  invalidPlacement: 0xe44a8a, // Magenta warning
  selection: 0xe4e44a,        // Electric yellow
  textPrimary: 0xe4e4e4,      // Off-white
  textSecondary: 0xa4a4c4,    // Muted lavender
} as const;

// Resident hunger indicator colors (Holographic tint)
export const HUNGER_COLORS = {
  satisfied: 0x4ae4e4,   // Cyan (70-100)
  hungry: 0xe4a44a,      // Amber (40-69)
  veryHungry: 0xe46a4a,  // Orange (20-39)
  critical: 0xe44a8a,    // Magenta pulse (0-19)
} as const;

// Room specifications
export const ROOM_SPECS = {
  lobby: {
    width: 20, // Grid units
    cost: 0,
    minFloor: 0,
    maxFloor: 0,
    color: ROOM_COLORS.lobby.base,
    accentColor: ROOM_COLORS.lobby.accent,
    income: 0,
    expenses: 0,
  },
  apartment: {
    width: 3,
    cost: 5000,
    minFloor: 1,
    maxFloor: 100,
    color: ROOM_COLORS.apartment.base,
    accentColor: ROOM_COLORS.apartment.accent,
    income: 100, // Rent per day
    expenses: 10, // Maintenance per day
    capacity: 2, // Residents
  },
  office: {
    width: 4,
    cost: 8000,
    minFloor: 1,
    maxFloor: 100,
    color: ROOM_COLORS.office.base,
    accentColor: ROOM_COLORS.office.accent,
    income: 200, // Per employed resident per day
    expenses: 20,
    jobs: 4, // Number of jobs
  },
  farm: {
    width: 4,
    cost: 15000,
    minFloor: 1,
    maxFloor: 100,
    color: ROOM_COLORS.farm.base,
    accentColor: ROOM_COLORS.farm.accent,
    income: 0,
    expenses: 50,
    foodProduction: 10, // Per day
  },
  kitchen: {
    width: 3,
    cost: 10000,
    minFloor: 1,
    maxFloor: 100,
    color: ROOM_COLORS.kitchen.base,
    accentColor: ROOM_COLORS.kitchen.accent,
    income: 0,
    expenses: 30,
    foodProcessing: 20, // Converts raw food to meals per day
  },
} as const;

export type RoomType = keyof typeof ROOM_SPECS;
