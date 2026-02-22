// Polyfill window for libraries that expect it
if (typeof window === 'undefined') {
  (self as any).window = self;
}

import { analyzeAudio } from './analysisEngine';

self.onmessage = (e) => {
  const { lowBuffer, midBuffer, highBuffer, sampleRate, duration, minBpm, maxBpm } = e.data;
  
  try {
    const result = analyzeAudio(
      lowBuffer,
      midBuffer,
      highBuffer,
      sampleRate,
      duration,
      minBpm,
      maxBpm
    );
    self.postMessage({ type: 'SUCCESS', result });
  } catch (err: any) {
    self.postMessage({ type: 'ERROR', error: err.message });
  }
};
