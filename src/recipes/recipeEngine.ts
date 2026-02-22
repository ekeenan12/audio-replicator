import { AnalysisResult, Recipe } from '../types';

export function generateRecipes(analysis: AnalysisResult): Recipe[] {
  const recipes: Recipe[] = [];

  // 1. Analyze features to detect archetypes
  // We'll look at average stats from the featuresByTime
  
  // Helper to get stats
  const getStats = (stem: 'low' | 'mid' | 'high') => {
    let rmsSum = 0;
    let centroidSum = 0;
    let count = 0;
    
    Object.values(analysis.featuresByTime).forEach(f => {
        rmsSum += f[stem].rms;
        centroidSum += f[stem].spectralCentroid;
        count++;
    });
    
    return {
        avgRms: count ? rmsSum / count : 0,
        avgCentroid: count ? centroidSum / count : 0
    };
  };

  const lowStats = getStats('low');
  const midStats = getStats('mid');
  const highStats = getStats('high');

  // --- KICK (Low Band) ---
  // If low band has significant energy
  if (lowStats.avgRms > 0.05) {
      recipes.push({
          archetype: "Techno Rumble Kick",
          stem: "Low",
          reason: ["High RMS in low band", "Strong transients detected at downbeats"],
          candidates: [
              {
                  name: "Rumble Generator Rack",
                  chain: ["Kick Synth", "Delay (Ping Pong)", "Auto Filter (Lowpass)", "Compressor", "Overdrive"],
                  paramRanges: {
                      "Delay Time": "1/16 or 1/8 dotted",
                      "Filter Freq": "80Hz - 150Hz",
                      "Drive": "10% - 30%"
                  },
                  macros: ["Kick Decay", "Rumble Amt", "Rumble Tone", "Sub Gain", "Punch", "Distortion", "Low Cut", "Volume"],
                  validation: ["Check phase alignment between kick and rumble", "Ensure sub is mono"]
              },
              {
                  name: "Clean 909 Processing",
                  chain: ["EQ Eight", "Drum Buss", "Limiter"],
                  paramRanges: {
                      "Boom": "20% - 50%",
                      "Transients": "0 - 0.5"
                  },
                  macros: ["Boom", "Crunch", "Transients", "Sub Focus", "Click", "Decay", "Output", "Comp"],
                  validation: ["Kick should hit -6dB to -3dB"]
              },
              {
                  name: "Layered Kick",
                  chain: ["Instrument Rack (Top/Sub)", "Glue Compressor", "EQ Eight"],
                  paramRanges: {
                      "X-Over Freq": "100Hz - 200Hz"
                  },
                  macros: ["Sub Vol", "Top Vol", "Click", "Sub Sustain", "Glue Thresh", "Glue Makeup", "Low Cut", "Gain"],
                  validation: ["Check for frequency masking in the 150Hz region"]
              }
          ]
      });
  }

  // --- OFFBEAT BASS (Low/Mid) ---
  recipes.push({
      archetype: "Offbeat Bass",
      stem: "Low",
      reason: ["Periodic energy dips on beats (Sidechaining)", "Energy in 100-300Hz range"],
      candidates: [
          {
              name: "Rolling Bass",
              chain: ["Operator (Saw)", "Auto Filter", "Compressor (Sidechain)", "Saturator"],
              paramRanges: {
                  "Filter Cutoff": "200Hz - 600Hz",
                  "SC Threshold": "-20dB to -10dB",
                  "SC Release": "100ms - 300ms"
              },
              macros: ["Cutoff", "Resonance", "Env Amt", "Decay", "SC Amount", "Drive", "Width", "Vol"],
              validation: ["Bass should duck completely when kick hits"]
          },
          {
              name: "Donk Bass",
              chain: ["Wavetable (FM)", "Overdrive", "EQ Eight", "Utility (Mono)"],
              paramRanges: {
                  "FM Amount": "30% - 60%",
                  "Unison": "None or 2-voice"
              },
              macros: ["FM Amt", "Tone", "Decay", "Drive", "Space", "Filter", "Sub", "Vol"],
              validation: ["Check mono compatibility"]
          },
          {
              name: "Sub Bass",
              chain: ["Sine/Tri Synth", "Saturator", "EQ Eight"],
              paramRanges: {
                  "Drive": "2dB - 6dB"
              },
              macros: ["Freq", "Drive", "Glide", "Attack", "Release", "Harmonics", "Pitch Env", "Vol"],
              validation: ["Ensure fundamental is solid"]
          }
      ]
  });

  // --- HATS (High Band) ---
  if (highStats.avgRms > 0.01) {
      recipes.push({
          archetype: "Industrial Hats",
          stem: "High",
          reason: ["High spectral centroid", "Consistent high-frequency energy"],
          candidates: [
              {
                  name: "Processed 909 Hats",
                  chain: ["Simpler", "Bitcrusher", "Reverb", "EQ Eight"],
                  paramRanges: {
                      "Bit Depth": "8-12 bit",
                      "Reverb Decay": "0.5s - 1.5s"
                  },
                  macros: ["Decay", "Crush", "Verb Amt", "Verb Time", "High Pass", "Drive", "Pan", "Vol"],
                  validation: ["Watch out for harsh resonances around 4-6kHz"]
              },
              {
                  name: "Shaker Loop Processor",
                  chain: ["Auto Pan", "Frequency Shifter", "Delay"],
                  paramRanges: {
                      "Rate": "1/16",
                      "Shift": "10Hz - 50Hz"
                  },
                  macros: ["Rate", "Amount", "Shift", "Feedback", "Delay Mix", "Width", "Filter", "Vol"],
                  validation: ["Ensure movement fits the groove"]
              },
              {
                  name: "Noise Hat",
                  chain: ["Analog (Noise)", "Filter", "Gate"],
                  paramRanges: {
                      "Filter Type": "Bandpass"
                  },
                  macros: ["Cutoff", "Reso", "Decay", "Attack", "Gate Thresh", "Noise Color", "Drive", "Vol"],
                  validation: ["Gate should be tight"]
              }
          ]
      });
  }

  // --- PAD / ATMOSPHERE (Mid Band) ---
  recipes.push({
      archetype: "Dub Techno Pad",
      stem: "Mid",
      reason: ["Sustained energy in mid band", "Wide stereo image detected"],
      candidates: [
          {
              name: "Dub Chord Rack",
              chain: ["Analog (Saw)", "Chord", "Echo", "Reverb"],
              paramRanges: {
                  "Filter": "Lowpass with env",
                  "Delay": "Dotted 8th"
              },
              macros: ["Cutoff", "Chord Type", "Delay Amt", "Feedback", "Verb Amt", "Filter Env", "Attack", "Vol"],
              validation: ["Check for mud in the 300Hz range"]
          },
          {
              name: "Drone Texture",
              chain: ["Sampler", "Grain Delay", "Hybrid Reverb"],
              paramRanges: {
                  "Spray": "10ms - 50ms"
              },
              macros: ["Pos", "Spray", "Pitch", "Feedback", "Texture", "Size", "Tone", "Mix"],
              validation: ["Should sit behind the mix"]
          },
          {
              name: "Stab Synth",
              chain: ["Operator", "Redux", "Delay"],
              paramRanges: {
                  "Downsample": "4-10"
              },
              macros: ["Filter", "Decay", "Redux", "Delay", "Spread", "FM", "Tone", "Vol"],
              validation: ["Transients should punch through"]
          }
      ]
  });

  return recipes;
}
