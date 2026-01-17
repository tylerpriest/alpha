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
  hunger: number;
  homeId: string | null;
  jobId: string | null;
  state: ResidentState;
}

export enum ResidentState {
  IDLE = 'IDLE',
  WALKING = 'WALKING',
  WORKING = 'WORKING',
  EATING = 'EATING',
  SLEEPING = 'SLEEPING',
}

export interface SaveData {
  version: number;
  timestamp: number;
  game: {
    money: number;
    day: number;
    hour: number;
  };
  resources: {
    food: number;
    rawFood: number;
  };
  rooms: RoomData[];
  residents: ResidentData[];
}

export interface EconomySnapshot {
  money: number;
  dailyIncome: number;
  dailyExpenses: number;
}
