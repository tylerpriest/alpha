import { RoomType } from './constants';

export interface Position {
  x: number;
  y: number;
}

export interface GridPosition {
  floor: number;
  position: number;
}

export interface RoomData {
  id: string;
  type: RoomType;
  floor: number;
  position: number;
  width: number;
}

export interface ResidentData {
  id: string;
  name: string;
  type: 'office_worker' | 'resident';
  hunger: number;
  stress: number; // 0-100
  homeId: string | null;
  jobId: string | null;
  state: ResidentState;
}

export enum ResidentState {
  IDLE = 'IDLE',
  WALKING = 'WALKING',
  WALKING_TO_ELEVATOR = 'WALKING_TO_ELEVATOR',
  WAITING_FOR_ELEVATOR = 'WAITING_FOR_ELEVATOR',
  RIDING_ELEVATOR = 'RIDING_ELEVATOR',
  WORKING = 'WORKING',
  EATING = 'EATING',
  SLEEPING = 'SLEEPING',
}

// Save/Load System Types
export interface SaveData {
  version: string;           // Save format version for migration
  timestamp: number;         // Unix timestamp of save
  checksum: string;          // Integrity hash

  building: BuildingSaveData;
  residents: ResidentSaveData[];
  economy: EconomySaveData;
  time: TimeSaveData;
  resources: ResourceSaveData;
  settings: SettingsSaveData;
}

export interface BuildingSaveData {
  floors: FloorSaveData[];
  rooms: RoomSaveData[];
  nextRoomId: number;
}

export interface FloorSaveData {
  level: number;             // Floor index (0 = ground, negative = basement)
}

export interface RoomSaveData {
  id: string;
  type: RoomType;
  floorLevel: number;
  gridX: number;
  width: number;
  occupantIds: string[];     // Resident IDs for residential rooms
  workerIds: string[];       // Resident IDs for commercial rooms
  // Room-specific state (e.g., food stock for restaurants)
  state: Record<string, unknown>;
}

export interface ResidentSaveData {
  id: string;
  name: string;
  type: 'office_worker' | 'resident';
  hunger: number;            // 0-100
  stress: number;            // 0-100 (for future use)
  jobRoomId: string | null;
  homeRoomId: string | null;
  state: ResidentState;      // 'idle' | 'working' | 'eating' | 'sleeping' | etc.
  position: { x: number; y: number };
}

export interface EconomySaveData {
  money: number;
  dailyIncome: number;
  dailyExpenses: number;
  lastQuarterDay: number; // Last day when quarterly revenue was processed
  quarterlyRevenue: number; // Last quarterly revenue amount
  // Historical data for graphs (optional)
  history?: { day: number; income: number; expenses: number }[];
}

export interface TimeSaveData {
  day: number;
  hour: number;              // 0-23
  minute: number;            // 0-59
  dayOfWeek: number;         // 0-6 (0=Sunday)
  speed: number;             // Current game speed multiplier
  lastAutoSaveDay: number;   // Track auto-save timing
}

export interface ResourceSaveData {
  rawFood: number;
  processedFood: number;
}

export interface SettingsSaveData {
  masterVolume: number;      // 0-100
  uiVolume: number;          // 0-100
  ambientVolume: number;     // 0-100
  defaultGameSpeed: number;  // Default speed on load
}

export interface SaveSlotMeta {
  slot: number;              // 0 = auto, 1-3 = manual
  isEmpty: boolean;
  timestamp: number;
  dayCount: number;
  population: number;
  money: number;
}

export interface EconomySnapshot {
  money: number;
  dailyIncome: number;
  dailyExpenses: number;
}

export enum GameState {
  MAIN_MENU = 'MAIN_MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
}

export interface GameSettings {
  masterVolume: number;      // 0-100
  uiVolume: number;          // 0-100
  ambientVolume: number;     // 0-100
  defaultGameSpeed: 1 | 2 | 4;
}

// Elevator System Types
export enum ElevatorState {
  IDLE = 'IDLE',
  DOORS_OPENING = 'DOORS_OPENING',
  LOADING = 'LOADING',
  DOORS_CLOSING = 'DOORS_CLOSING',
  MOVING = 'MOVING',
}

export interface ElevatorCall {
  floor: number;
  direction: 'up' | 'down';
  timestamp: number;
  residentIds: string[];  // Residents waiting at this floor
}

export interface ElevatorShaftData {
  id: string;
  position: number;     // X position in grid units
  minFloor: number;     // Lowest floor served
  maxFloor: number;     // Highest floor served
  zone: number;         // Zone this elevator serves (0 = floors 0-14, 1 = floors 15-29, etc.)
}

export interface ElevatorCarData {
  currentFloor: number;
  targetFloor: number | null;
  passengerIds: string[];
  capacity: number;
  state: ElevatorState;
  direction: 'up' | 'down' | 'idle';
}
