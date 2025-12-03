export class AudioService {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;

  async initialize() {
    if (this.audioContext) return;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256; // Tradeoff between resolution and performance
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.source.connect(this.analyser);
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    } catch (e) {
      console.error("Audio init failed", e);
    }
  }

  getFrequencyData(): { bass: number; mid: number; high: number; average: number } {
    if (!this.analyser || !this.dataArray) {
      return { bass: 0, mid: 0, high: 0, average: 0 };
    }

    this.analyser.getByteFrequencyData(this.dataArray);

    const length = this.dataArray.length;
    const bassRange = Math.floor(length * 0.1);
    const midRange = Math.floor(length * 0.5);

    let bass = 0, mid = 0, high = 0;

    for (let i = 0; i < length; i++) {
      const val = this.dataArray[i] / 255.0; // Normalize 0-1
      if (i < bassRange) bass += val;
      else if (i < midRange) mid += val;
      else high += val;
    }

    bass /= bassRange;
    mid /= (midRange - bassRange);
    high /= (length - midRange);

    return {
      bass,
      mid,
      high,
      average: (bass + mid + high) / 3
    };
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.audioContext = null;
  }
}

export const audioService = new AudioService();