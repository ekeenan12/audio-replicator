import React, { useState, useRef } from 'react';
import { Upload, Play, Download, Wand2, Loader2, Music } from 'lucide-react';

interface ControlPanelProps {
  onFileUpload: (file: File) => void;
  onGenerateDemo: () => void;
  onExport: () => void;
  isAnalyzing: boolean;
  hasResults: boolean;
  onExplain?: () => void;
}

export function ControlPanel({ onFileUpload, onGenerateDemo, onExport, isAnalyzing, hasResults, onExplain }: ControlPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-xl border border-zinc-800 p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Rebuilder <span className="text-orange-500 text-sm font-mono align-top">MVP</span></h1>
        <p className="text-zinc-400 text-sm">Deterministic Audio Analysis & Recipe Generator</p>
      </div>

      {/* Upload Area */}
      <div 
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer ${dragActive ? 'border-orange-500 bg-orange-500/10' : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
            ref={fileInputRef} 
            type="file" 
            className="hidden" 
            accept="audio/*" 
            onChange={handleChange} 
        />
        <Upload className="text-zinc-400 mb-3" size={32} />
        <p className="text-zinc-300 font-medium text-center">Drop audio file here</p>
        <p className="text-zinc-500 text-xs mt-1">or click to browse (wav, mp3)</p>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button 
            onClick={onGenerateDemo}
            disabled={isAnalyzing}
            className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-lg font-medium transition-colors border border-zinc-700"
        >
            <Music size={18} />
            Generate Demo Loop
        </button>

        {hasResults && (
            <button 
                onClick={onExport}
                className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white py-3 rounded-lg font-medium transition-colors shadow-lg shadow-orange-900/20"
            >
                <Download size={18} />
                Export Pack (.zip)
            </button>
        )}

        {hasResults && onExplain && (
            <button 
                onClick={onExplain}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-900/20"
            >
                <Wand2 size={18} />
                Explain Results (Gemini)
            </button>
        )}
      </div>

      {/* Status */}
      {isAnalyzing && (
        <div className="flex items-center justify-center gap-3 text-orange-500 animate-pulse">
            <Loader2 className="animate-spin" size={20} />
            <span className="font-mono text-sm">Processing Audio...</span>
        </div>
      )}

      {/* Settings (Visual Only for MVP) */}
      <div className="mt-auto pt-6 border-t border-zinc-800 space-y-4 opacity-50 pointer-events-none">
        <div className="space-y-2">
            <label className="text-xs text-zinc-500 uppercase font-bold">BPM Range</label>
            <input type="range" className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer" />
            <div className="flex justify-between text-xs text-zinc-500 font-mono">
                <span>120</span>
                <span>150</span>
            </div>
        </div>
      </div>
    </div>
  );
}
