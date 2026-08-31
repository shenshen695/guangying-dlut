export type CameraPosition = {
  id: string;
  spotId: string;
  label: string;
  name: string;
  cameraPosition: string;
  cameraDirection: string;
  directionDegrees: number;
  sceneX: number;
  sceneY: number;
  recommendedTime: string;
  tags: string[];
  sampleWorkIds: string[];
  photographer: string | null;
  focalLength: string | null;
  tips: string;
};
