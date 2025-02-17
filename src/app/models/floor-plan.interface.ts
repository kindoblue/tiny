export interface Seat {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;  // Rotation in degrees (0, 90, 180, 270)
  status?: 'occupied' | 'available' | 'reserved';
}

export interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  seats: Seat[];
}

export interface Floor {
  id: string;
  name: string;
  rooms: Room[];
}

export interface Building {
  id: string;
  name: string;
  floors: Floor[];
} 