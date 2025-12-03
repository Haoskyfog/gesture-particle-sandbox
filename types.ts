export enum ShapeType {
  SPHERE = 'SPHERE',
  HEART = 'HEART',
  VORTEX = 'VORTEX',
  CUSTOM = 'CUSTOM',
}

export interface AppState {
  openness: number; // 0 (Fist) to 1 (Open Palm)
  isTracking: boolean;
  cameraPermitted: boolean;
  
  // Visual Settings
  particleCount: number;
  baseColor: string;
  shape: ShapeType;
  customPoints: Float32Array | null; // For custom drawn shapes
}

export type Point3D = [number, number, number];