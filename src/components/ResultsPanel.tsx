import React from 'react';
import { AnalysisResult, Recipe } from '../types';
import { FileMusic, Activity, Sliders, Info } from 'lucide-react';

interface ResultsPanelProps {
  analysis: AnalysisResult | null;
  recipes: Recipe[];
}

export function ResultsPanel({ analysis, recipes }: ResultsPanelProps) {
  const [activeTab, setActiveTab] = React.useState<'results' | 'charts' | 'recipes'>('results');

  if (!analysis) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-500">
        <p>Run analysis to see results</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('results')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'results' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
        >
          <Info size={16} /> Results
        </button>
        <button
          onClick={() => setActiveTab('charts')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'charts' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
        >
          <Activity size={16} /> Charts
        </button>
        <button
          onClick={() => setActiveTab('recipes')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'recipes' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
        >
          <Sliders size={16} /> Recipes
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'results' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">BPM</div>
                <div className="text-3xl font-mono text-white">{analysis.bpm}</div>
              </div>
              <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Key (Est)</div>
                <div className="text-3xl font-mono text-white">{analysis.keyCandidates[0]?.key || 'Unknown'}</div>
                <div className="text-xs text-zinc-600 mt-1">Confidence: {Math.round((analysis.keyCandidates[0]?.score || 0) * 100)}%</div>
              </div>
            </div>

            <div>
              <h3 className="text-zinc-400 text-sm font-medium mb-3 uppercase tracking-wider">Segments</h3>
              <div className="space-y-2">
                {analysis.segments.map((seg, i) => (
                  <div key={i} className="flex justify-between items-center bg-zinc-800/50 p-3 rounded border border-zinc-800">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${getSegmentBadgeColor(seg.label)}`}>
                      {seg.label}
                    </span>
                    <div className="text-zinc-400 text-sm font-mono">
                      Bar {seg.startBar} - {seg.endBar}
                    </div>
                    <div className="text-zinc-600 text-xs font-mono">
                      {seg.startTime.toFixed(1)}s
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="space-y-4">
             <p className="text-zinc-500 text-sm">Energy & Centroid over time (Simplified Visualization)</p>
             {/* Simple SVG Chart */}
             <div className="h-40 w-full bg-zinc-950 rounded border border-zinc-800 relative overflow-hidden">
                <svg className="w-full h-full" preserveAspectRatio="none">
                    {/* Render a simple line for RMS (Low band) */}
                    <path 
                        d={generatePath(analysis.featuresByTime, 'low', 'rms', 100)} 
                        fill="none" 
                        stroke="#ef4444" 
                        strokeWidth="2" 
                    />
                     {/* Render a simple line for Centroid (High band) */}
                     <path 
                        d={generatePath(analysis.featuresByTime, 'high', 'spectralCentroid', 0.01)} 
                        fill="none" 
                        stroke="#3b82f6" 
                        strokeWidth="2" 
                        opacity="0.7"
                    />
                </svg>
                <div className="absolute top-2 right-2 flex gap-2 text-xs">
                    <span className="text-red-500">Low RMS</span>
                    <span className="text-blue-500">High Centroid</span>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'recipes' && (
          <div className="space-y-6">
            {recipes.map((recipe, i) => (
              <div key={i} className="bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden">
                <div className="bg-zinc-900 p-3 border-b border-zinc-800 flex justify-between items-center">
                    <h3 className="font-bold text-white">{recipe.archetype}</h3>
                    <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400">{recipe.stem} Band</span>
                </div>
                <div className="p-3">
                    <div className="mb-3">
                        <p className="text-xs text-zinc-500 mb-1">Detected because:</p>
                        <ul className="list-disc list-inside text-xs text-zinc-400">
                            {recipe.reason.map((r, idx) => <li key={idx}>{r}</li>)}
                        </ul>
                    </div>
                    
                    <div className="space-y-3">
                        {recipe.candidates.map((cand, idx) => (
                            <div key={idx} className="bg-zinc-900/50 p-3 rounded border border-zinc-800/50">
                                <div className="font-medium text-orange-400 text-sm mb-2">{cand.name}</div>
                                <div className="text-xs text-zinc-400 mb-2">
                                    <span className="text-zinc-500">Chain:</span> {cand.chain.join(" > ")}
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    {Object.entries(cand.paramRanges).slice(0, 4).map(([k, v], j) => (
                                        <div key={j} className="text-xs bg-black/20 p-1 rounded">
                                            <span className="text-zinc-500 block">{k}</span>
                                            <span className="text-zinc-300">{v}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getSegmentBadgeColor(label: string) {
    switch (label) {
        case 'INTRO': return 'bg-blue-900 text-blue-200';
        case 'BREAK': return 'bg-purple-900 text-purple-200';
        case 'DROP': return 'bg-red-900 text-red-200';
        case 'OUTRO': return 'bg-gray-800 text-gray-300';
        default: return 'bg-green-900 text-green-200';
    }
}

function generatePath(features: any, stem: string, metric: string, scale: number): string {
    const times = Object.keys(features).map(Number).sort((a, b) => a - b);
    if (times.length === 0) return "";
    
    const maxTime = times[times.length - 1];
    let d = `M 0 ${100}`; // Start bottom left (SVG coords are top-down, so 100 is bottom)
    
    times.forEach(t => {
        const val = features[t][stem][metric];
        const x = (t / maxTime) * 100; // Percent width
        // Normalize Y roughly
        const y = 100 - (Math.min(val * scale, 1) * 100); 
        d += ` L ${x}% ${y}`; // Use percentage for width
    });
    
    return d;
}
