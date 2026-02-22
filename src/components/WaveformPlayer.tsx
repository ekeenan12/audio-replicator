import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import { AnalysisResult } from '../types';

interface WaveformPlayerProps {
  audioUrl: string | null;
  analysis: AnalysisResult | null;
}

export function WaveformPlayer({ audioUrl, analysis }: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<RegionsPlugin | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !audioUrl) return;

    // Initialize WaveSurfer
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#4b5563',
      progressColor: '#f97316', // Orange-500
      cursorColor: '#ffffff',
      barWidth: 2,
      barGap: 1,
      height: 128,
      normalize: true,
    });

    // Initialize Regions
    const wsRegions = RegionsPlugin.create();
    ws.registerPlugin(wsRegions);
    regionsRef.current = wsRegions;

    ws.load(audioUrl);

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => setIsPlaying(false));

    wavesurferRef.current = ws;

    return () => {
      ws.destroy();
    };
  }, [audioUrl]);

  // Update regions/markers when analysis changes
  useEffect(() => {
    if (!wavesurferRef.current || !regionsRef.current || !analysis) return;

    regionsRef.current.clearRegions();

    // Add Downbeats
    analysis.beatGrid.downbeats.forEach((time, i) => {
        regionsRef.current?.addRegion({
            start: time,
            end: time, // Marker
            color: 'rgba(255, 255, 255, 0.5)',
            drag: false,
            resize: false,
        });
    });

    // Add Segments
    analysis.segments.forEach(seg => {
        regionsRef.current?.addRegion({
            start: seg.startTime,
            end: seg.endTime || (seg.startTime + 1), // Fallback length
            color: getSegmentColor(seg.label),
            content: seg.label,
            drag: false,
            resize: false,
        });
    });

  }, [analysis]);

  const togglePlay = () => {
    wavesurferRef.current?.playPause();
  };

  return (
    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-lg">
      <div ref={containerRef} className="w-full mb-4" />
      <div className="flex justify-center">
        <button
          onClick={togglePlay}
          className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-full font-medium transition-colors"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>
    </div>
  );
}

function getSegmentColor(label: string): string {
    switch (label) {
        case 'INTRO': return 'rgba(59, 130, 246, 0.2)'; // Blue
        case 'BREAK': return 'rgba(168, 85, 247, 0.2)'; // Purple
        case 'DROP': return 'rgba(239, 68, 68, 0.2)'; // Red
        case 'OUTRO': return 'rgba(107, 114, 128, 0.2)'; // Gray
        default: return 'rgba(34, 197, 94, 0.2)'; // Green
    }
}
