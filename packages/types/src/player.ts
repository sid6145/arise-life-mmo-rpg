export interface Player {
  id: string;
  username: string;
  level: number;
  currentXp: number;
  nextLevelXp: number;
  createdAt: Date;
  updatedAt: Date;
}
