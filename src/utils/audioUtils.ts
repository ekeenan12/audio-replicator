export async function decodeAudio(file: File): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  return await audioContext.decodeAudioData(arrayBuffer);
}

export async function renderStems(audioBuffer: AudioBuffer): Promise<{ low: Float32Array, mid: Float32Array, high: Float32Array }> {
  const offlineCtx = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;

  // Filters
  const lowFilter = offlineCtx.createBiquadFilter();
  lowFilter.type = 'lowpass';
  lowFilter.frequency.value = 150;

  const midLowFilter = offlineCtx.createBiquadFilter();
  midLowFilter.type = 'highpass';
  midLowFilter.frequency.value = 150;
  const midHighFilter = offlineCtx.createBiquadFilter();
  midHighFilter.type = 'lowpass';
  midHighFilter.frequency.value = 2000;

  const highFilter = offlineCtx.createBiquadFilter();
  highFilter.type = 'highpass';
  highFilter.frequency.value = 2000;

  // We need to render these separately or use a splitter/merger to capture them?
  // OfflineAudioContext renders to a SINGLE destination.
  // To get 3 separate stems, we actually need to run 3 separate offline renders OR 
  // use a ScriptProcessor (deprecated) / AudioWorklet (complex) to record.
  // EASIER: Run 3 offline renders. It's fast enough for a single track usually.
  
  // 1. LOW
  const lowCtx = new OfflineAudioContext(1, audioBuffer.length, audioBuffer.sampleRate);
  const lowSrc = lowCtx.createBufferSource();
  lowSrc.buffer = audioBuffer;
  const lowF = lowCtx.createBiquadFilter();
  lowF.type = 'lowpass';
  lowF.frequency.value = 150;
  lowSrc.connect(lowF);
  lowF.connect(lowCtx.destination);
  lowSrc.start();
  const lowRendered = await lowCtx.startRendering();

  // 2. MID
  const midCtx = new OfflineAudioContext(1, audioBuffer.length, audioBuffer.sampleRate);
  const midSrc = midCtx.createBufferSource();
  midSrc.buffer = audioBuffer;
  const midF1 = midCtx.createBiquadFilter();
  midF1.type = 'highpass';
  midF1.frequency.value = 150;
  const midF2 = midCtx.createBiquadFilter();
  midF2.type = 'lowpass';
  midF2.frequency.value = 2000;
  midSrc.connect(midF1);
  midF1.connect(midF2);
  midF2.connect(midCtx.destination);
  midSrc.start();
  const midRendered = await midCtx.startRendering();

  // 3. HIGH
  const highCtx = new OfflineAudioContext(1, audioBuffer.length, audioBuffer.sampleRate);
  const highSrc = highCtx.createBufferSource();
  highSrc.buffer = audioBuffer;
  const highF = highCtx.createBiquadFilter();
  highF.type = 'highpass';
  highF.frequency.value = 2000;
  highSrc.connect(highF);
  highF.connect(highCtx.destination);
  highSrc.start();
  const highRendered = await highCtx.startRendering();

  return {
    low: lowRendered.getChannelData(0),
    mid: midRendered.getChannelData(0),
    high: highRendered.getChannelData(0)
  };
}

export async function generateDemoLoop(): Promise<Blob> {
  const sampleRate = 44100;
  const duration = 16 * (60 / 128) * 4; // 16 bars at 128 BPM (approx 30s)
  const length = sampleRate * 30; // Fixed 30s for simplicity
  const offlineCtx = new OfflineAudioContext(1, length, sampleRate);

  // Kick (Every beat)
  const beatLen = sampleRate * (60 / 128);
  for (let i = 0; i < length; i += beatLen) {
    const osc = offlineCtx.createOscillator();
    osc.frequency.setValueAtTime(150, i / sampleRate);
    osc.frequency.exponentialRampToValueAtTime(0.01, (i / sampleRate) + 0.5);
    
    const gain = offlineCtx.createGain();
    gain.gain.setValueAtTime(1, i / sampleRate);
    gain.gain.exponentialRampToValueAtTime(0.01, (i / sampleRate) + 0.5);
    
    osc.connect(gain);
    gain.connect(offlineCtx.destination);
    osc.start(i / sampleRate);
    osc.stop((i / sampleRate) + 0.5);
  }

  // Hi-hats (16th notes)
  const sixteenthLen = beatLen / 4;
  for (let i = 0; i < length; i += sixteenthLen) {
      // Noise buffer
      const bufferSize = sampleRate * 0.05;
      const buffer = offlineCtx.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) {
          data[j] = Math.random() * 2 - 1;
      }
      
      const noise = offlineCtx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = offlineCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 5000;
      
      const gain = offlineCtx.createGain();
      gain.gain.setValueAtTime(0.3, i / sampleRate);
      gain.gain.exponentialRampToValueAtTime(0.01, (i / sampleRate) + 0.05);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(offlineCtx.destination);
      noise.start(i / sampleRate);
  }
  
  // Bass (Offbeat)
  for (let i = beatLen / 2; i < length; i += beatLen) {
      const osc = offlineCtx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 55; // A1
      
      const filter = offlineCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, i / sampleRate);
      filter.frequency.exponentialRampToValueAtTime(100, (i / sampleRate) + 0.2);
      
      const gain = offlineCtx.createGain();
      gain.gain.setValueAtTime(0.6, i / sampleRate);
      gain.gain.linearRampToValueAtTime(0, (i / sampleRate) + 0.3);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(offlineCtx.destination);
      osc.start(i / sampleRate);
      osc.stop((i / sampleRate) + 0.3);
  }

  const renderedBuffer = await offlineCtx.startRendering();
  
  // Convert to WAV Blob
  return bufferToWave(renderedBuffer, length);
}

// Helper to convert AudioBuffer to WAV Blob
function bufferToWave(abuffer: AudioBuffer, len: number) {
  const numOfChan = abuffer.numberOfChannels;
  const length = len * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit (hardcoded in this example)

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // write interleaved data
  for (i = 0; i < abuffer.numberOfChannels; i++)
    channels.push(abuffer.getChannelData(i));

  while (pos < len) {
    for (i = 0; i < numOfChan; i++) {
      // interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
      view.setInt16(44 + offset, sample, true);
      offset += 2;
    }
    pos++;
  }

  return new Blob([buffer], { type: 'audio/wav' });

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}
