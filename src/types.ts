export interface AudioFeatures {
  rms: number;
  spectralCentroid: number;
  spectralRolloff: number;
  spectralFlux: number;
}

export interface FeaturesByTime {
  [time: number]: {
    low: AudioFeatures;
    mid: AudioFeatures;
    high: AudioFeatures;
  };
}

export interface Segment {
  label: 'INTRO' | 'BREAK' | 'DROP' | 'OUTRO' | 'SECTION';
  startTime: number;
  endTime: number;
  startBar: number;
  endBar: number;
}

export interface BeatGrid {
  bpm: number;
  offset: number;
  beats: number[]; // Time in seconds
  downbeats: number[]; // Time in seconds
}

export interface KeyCandidate {
  key: string;
  score: number;
}

export interface AnalysisResult {
  duration: number;
  bpm: number;
  beatGrid: BeatGrid;
  segments: Segment[];
  keyCandidates: KeyCandidate[];
  featuresByTime: FeaturesByTime; // Downsampled for charting
  events: { time: number; label: string }[];
}

export interface RecipeCandidate {
  name: string;
  chain: string[];
  paramRanges: Record<string, string>;
  macros: string[];
  validation: string[];
}

export interface Recipe {
  archetype: string;
  stem: 'Low' | 'Mid' | 'High';
  candidates: RecipeCandidate[];
  reason: string[];
}

export interface ExportPackData {
  analysis: AnalysisResult;
  recipes: Recipe[];
}
