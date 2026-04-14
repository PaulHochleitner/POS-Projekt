export interface Team {
  id: number;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  createdAt: string;
  players: Player[];
}

export interface Player {
  id: number;
  name: string;
  number: number;
  position: Position;
  pace: number | null;
  passing: number | null;
  shooting: number | null;
  defending: number | null;
  physical: number | null;
  dribbling: number | null;
  imageUrl: string | null;
  teamId: number;
}

export type Position = 'GK' | 'CB' | 'LB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'LM' | 'RM' | 'LW' | 'RW' | 'ST';

export interface Tactic {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  teamId: number | null;
  teamName: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  versionCount: number;
  latestVersion: TacticVersion | null;
}

export interface TacticVersion {
  id: number;
  versionNumber: number;
  label: string | null;
  frames: string | null;
  createdAt: string;
}

export interface FrameData {
  frames: Frame[];
  animationSpeed: number;
  pitchType: string;
}

export interface Frame {
  index: number;
  label: string;
  players: PlayerPosition[];
  ball: BallPosition;
}

export interface PlayerPosition {
  playerId: number;
  playerName: string;
  playerNumber: number;
  position: string;
  x: number;
  y: number;
}

export interface BallPosition {
  x: number;
  y: number;
  carriedByPlayerId: number | null;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface TagDto {
  id: number;
  name: string;
  usageCount: number;
}

export interface VersionCompare {
  version1: TacticVersion;
  version2: TacticVersion;
  diff: {
    framesAddedOrRemoved: number;
    playerChanges: string[];
    ballChanges: string[];
  };
}
