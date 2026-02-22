import { useState, useEffect, useRef } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { WaveformPlayer } from './components/WaveformPlayer';
import { ResultsPanel } from './components/ResultsPanel';
import { AnalysisResult, Recipe } from './types';
import { decodeAudio, renderStems, generateDemoLoop } from './utils/audioUtils';
import { generateRecipes } from './recipes/recipeEngine';
import { generateExportPack } from './export/exportPack';
import { explainResults } from './services/geminiService';
import AnalysisWorker from './analysis/analysisWorker?worker';

function App() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new AnalysisWorker();
    
    workerRef.current.onmessage = (e) => {
      const { type, result, error } = e.data;
      if (type === 'SUCCESS') {
        setAnalysis(result);
        const generatedRecipes = generateRecipes(result);
        setRecipes(generatedRecipes);
        setIsAnalyzing(false);
      } else if (type === 'ERROR') {
        console.error("Analysis Error:", error);
        setIsAnalyzing(false);
        alert("Analysis failed: " + error);
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const handleFileUpload = async (file: File) => {
    setIsAnalyzing(true);
    setAnalysis(null);
    setRecipes([]);
    setExplanation(null);
    
    const url = URL.createObjectURL(file);
    setAudioUrl(url);

    try {
      // 1. Decode
      const audioBuffer = await decodeAudio(file);
      
      // 2. Render Stems (Main Thread - OfflineContext is fast)
      const stems = await renderStems(audioBuffer);
      
      // 3. Send to Worker
      workerRef.current?.postMessage({
        lowBuffer: stems.low,
        midBuffer: stems.mid,
        highBuffer: stems.high,
        sampleRate: audioBuffer.sampleRate,
        duration: audioBuffer.duration,
        minBpm: 120, // Could be from settings
        maxBpm: 150
      }, [stems.low.buffer, stems.mid.buffer, stems.high.buffer]); // Transferables

    } catch (err) {
      console.error(err);
      setIsAnalyzing(false);
      alert("Failed to process audio file.");
    }
  };

  const handleGenerateDemo = async () => {
    setIsAnalyzing(true);
    try {
        const blob = await generateDemoLoop();
        const file = new File([blob], "demo_loop.wav", { type: "audio/wav" });
        await handleFileUpload(file);
    } catch (e) {
        console.error(e);
        setIsAnalyzing(false);
    }
  };

  const handleExport = async () => {
    if (!analysis) return;
    const blob = await generateExportPack({ analysis, recipes });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "rebuilder_pack.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExplain = async () => {
    if (!analysis) return;
    try {
        const text = await explainResults(analysis, recipes);
        setExplanation(text || "No explanation returned.");
    } catch (e) {
        console.error(e);
        alert("Failed to get explanation from Gemini.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-4rem)]">
        
        {/* Left Panel: Controls */}
        <div className="lg:col-span-3 h-full">
          <ControlPanel 
            onFileUpload={handleFileUpload}
            onGenerateDemo={handleGenerateDemo}
            onExport={handleExport}
            isAnalyzing={isAnalyzing}
            hasResults={!!analysis}
            onExplain={handleExplain}
          />
        </div>

        {/* Center Panel: Waveform */}
        <div className="lg:col-span-5 flex flex-col gap-6 h-full">
          <div className="flex-none">
            <WaveformPlayer audioUrl={audioUrl} analysis={analysis} />
          </div>
          
          {/* Explanation Box */}
          {explanation && (
            <div className="flex-1 bg-zinc-900/80 p-6 rounded-xl border border-indigo-500/30 overflow-y-auto">
                <h3 className="text-indigo-400 font-bold mb-2 flex items-center gap-2">
                    Gemini Analysis
                </h3>
                <div className="prose prose-invert prose-sm">
                    <p className="whitespace-pre-line">{explanation}</p>
                </div>
            </div>
          )}
          
          {!explanation && (
             <div className="flex-1 bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 flex items-center justify-center text-zinc-600">
                <p>Waveform & Analysis Visualization</p>
             </div>
          )}
        </div>

        {/* Right Panel: Results */}
        <div className="lg:col-span-4 h-full">
          <ResultsPanel analysis={analysis} recipes={recipes} />
        </div>

      </div>
    </div>
  );
}

export default App;
