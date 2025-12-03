import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

// Singleton wrapper for the MediaPipe HandLandmarker
class VisionService {
  private handLandmarker: HandLandmarker | null = null;
  private video: HTMLVideoElement | null = null;
  private lastVideoTime = -1;
  private animationFrameId: number | null = null;
  private onResult: ((openness: number) => void) | null = null;
  
  // Smoothing state
  private smoothedOpenness = 0.5;

  async initialize() {
    if (this.handLandmarker) return;

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );

    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 1
    });
  }

  start(videoElement: HTMLVideoElement, onResult: (openness: number) => void) {
    this.video = videoElement;
    this.onResult = onResult;
    this.loop();
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.onResult = null;
  }

  private loop = () => {
    this.animationFrameId = requestAnimationFrame(this.loop);
    
    // Ensure video is ready and has valid dimensions to prevent WASM crashes (ROI error)
    if (
      this.handLandmarker && 
      this.video && 
      this.video.videoWidth > 0 && 
      this.video.videoHeight > 0 &&
      this.video.currentTime !== this.lastVideoTime
    ) {
      this.lastVideoTime = this.video.currentTime;
      
      try {
        const results = this.handLandmarker.detectForVideo(this.video, performance.now());
        
        // Prefer worldLandmarks (meters) for accurate geometric calculation regardless of camera distance
        const landmarks = results.worldLandmarks && results.worldLandmarks.length > 0 
          ? results.worldLandmarks[0] 
          : (results.landmarks && results.landmarks.length > 0 ? results.landmarks[0] : null);

        if (landmarks) {
          const rawOpenness = this.calculateOpenness(landmarks);
          
          // Smooth the output to reduce jitter (Exponential Moving Average)
          // alpha = 0.2 means 20% new value, 80% old value
          this.smoothedOpenness = this.smoothedOpenness * 0.8 + rawOpenness * 0.2;

          if (this.onResult) {
            this.onResult(this.smoothedOpenness);
          }
        } else {
          // If no hand detected, slowly drift to default (0.5)
          this.smoothedOpenness = this.smoothedOpenness * 0.95 + 0.5 * 0.05;
          if (this.onResult) this.onResult(this.smoothedOpenness); 
        }
      } catch (error) {
        // Suppress errors if video stream is temporarily invalid or MediaPipe glitches
        console.warn("MediaPipe detection error:", error);
      }
    }
  };

  private calculateOpenness(landmarks: any[]): number {
    const wrist = landmarks[0];
    
    // Reference Scale: Distance from Wrist to Middle Finger MCP (Knuckle)
    // This allows the calculation to work regardless of hand size or camera distance
    const mcp = landmarks[9];
    const palmScale = Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y, mcp.z - wrist.z);
    
    // Calculate average distance from Wrist to Fingertips
    const tips = [8, 12, 16, 20]; // Index, Middle, Ring, Pinky
    let totalTipDist = 0;
    
    tips.forEach(idx => {
      const tip = landmarks[idx];
      totalTipDist += Math.hypot(tip.x - wrist.x, tip.y - wrist.y, tip.z - wrist.z);
    });
    
    const avgTipDist = totalTipDist / tips.length;
    
    // Ratio of Tip Distance to Palm Scale
    // Closed Fist: Tips are close to wrist. Ratio ~ 0.5 to 0.8
    // Open Hand: Tips are far from wrist. Ratio ~ 1.8 to 2.2
    const ratio = avgTipDist / palmScale;
    
    // Map ratio to 0-1 range
    const minRatio = 0.7; // Fist
    const maxRatio = 2.0; // Open Palm
    
    return Math.min(Math.max((ratio - minRatio) / (maxRatio - minRatio), 0), 1);
  }
}

export const visionService = new VisionService();