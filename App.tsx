import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { 
  Hand, Box, Heart, Wind, PenTool, Video, VideoOff, 
  Mic, MicOff, Camera, Eye, EyeOff, X
} from 'lucide-react';

import { visionService } from './services/vision';
import { audioService } from './services/audio';
import { ParticleSystem } from './components/ParticleSystem';
import { DrawingCanvas } from './components/DrawingCanvas';
import { ShapeType } from './types';

// Fix for missing JSX types
declare global {
  namespace JSX {
    interface IntrinsicElements {
      color: any;
      ambientLight: any;
      pointLight: any;
      div: any;
      h1: any;
      span: any;
      button: any;
      video: any;
      input: any;
    }
  }
}

function App() {
  // --- STATE ---
  const [permissionState, setPermissionState] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [openness, setOpenness] = useState(0.5); 
  const [isTracking, setIsTracking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  
  // Physics Refs
  const opennessRef = useRef(0.5);
  const lastUiUpdateTime = useRef(0);
  
  // Visual Config
  const [shape, setShape] = useState<ShapeType>(ShapeType.SPHERE);
  const [color, setColor] = useState('#00eaff'); // Cyan default
  const [particleCount, setParticleCount] = useState(5000);
  const [customPoints, setCustomPoints] = useState<Float32Array | null>(null);
  
  // UI State
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- INIT ---
  useEffect(() => {
    const initServices = async () => {
      try {
        // Vision
        await visionService.initialize();
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setPermissionState('granted');
          
          visionService.start(videoRef.current, (val) => {
             opennessRef.current = val;
             const now = Date.now();
             // Throttle UI updates to 15fps
             if (now - lastUiUpdateTime.current > 60) {
                setOpenness(val);
                setIsTracking(true);
                lastUiUpdateTime.current = now;
             }
          });
        }
      } catch (err) {
        console.error("Camera error:", err);
        setPermissionState('denied');
      }
    };
    initServices();

    return () => {
      visionService.stop();
      audioService.stop();
    };
  }, []);

  const toggleAudio = async () => {
    if (!audioEnabled) {
      await audioService.initialize();
      setAudioEnabled(true);
    } else {
      audioService.stop();
      setAudioEnabled(false);
    }
  };

  const handleCustomShape = (points: Float32Array) => {
    setCustomPoints(points);
    setShape(ShapeType.CUSTOM);
  };

  const takeScreenshot = () => {
    // We need to access the canvas from the R3F context, but as a shortcut
    // we can try to find the canvas in the DOM since we only have one.
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.setAttribute('download', 'particle-art.png');
      link.setAttribute('href', canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream'));
      link.click();
    }
  };

  return (
    <div className={`relative w-full h-screen bg-black overflow-hidden selection:bg-cyan-500/30 font-sans ${zenMode ? 'cursor-none' : ''}`}>
      
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Canvas 
          gl={{ preserveDrawingBuffer: true, antialias: true, alpha: false }} // Buffer for screenshot
          camera={{ position: [0, 0, 18], fov: 50 }}
          dpr={[1, 2]} // High DPI
        >
          <color attach="background" args={['#030305']} />
          <Stars radius={150} depth={50} count={6000} factor={4} saturation={0} fade speed={0.5} />
          
          {/* Subtle lighting for depth (particles are additive though) */}
          <pointLight position={[10, 10, 10]} intensity={0.5} color={color} />
          <ambientLight intensity={0.2} />

          <ParticleSystem 
            count={particleCount} 
            shape={shape} 
            opennessRef={opennessRef} 
            color={color} 
            customPoints={customPoints}
            audioEnabled={audioEnabled}
          />
          
          <OrbitControls 
            enablePan={false} 
            enableZoom={true}
            minDistance={5} 
            maxDistance={40} 
            autoRotate={!isTracking && !zenMode} 
            autoRotateSpeed={0.8}
            dampingFactor={0.05}
          />
        </Canvas>
      </div>

      {/* Hidden Analysis Video */}
      <video 
        ref={videoRef} 
        className={`fixed top-4 right-4 w-40 h-auto rounded-lg border border-white/20 shadow-2xl z-50 transition-all duration-300 ${debugMode ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`} 
        playsInline 
        muted
      />

      {/* --- UI LAYER --- */}
      
      {/* 1. Header Area (Fade out in Zen Mode) */}
      <div className={`absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10 transition-all duration-700 ${zenMode ? '-translate-y-20 opacity-0' : 'translate-y-0 opacity-100'}`}>
        <div>
          <h1 className="text-4xl font-light tracking-tighter text-white/90">
            AETHER <span className="text-xs align-top font-bold text-cyan-400 tracking-widest opacity-80">SANDBOX</span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
             <div className={`w-1.5 h-1.5 rounded-full ${isTracking ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'bg-red-400'}`} />
             <span className="text-[10px] uppercase tracking-widest text-white/40">
               {isTracking ? 'System Online' : 'Awaiting Input'}
             </span>
          </div>
        </div>

        {/* Top Right Tools */}
        <div className="flex gap-2">
          <button 
             onClick={() => setDebugMode(!debugMode)}
             className={`p-3 rounded-full backdrop-blur-md border transition-all ${debugMode ? 'bg-white/10 border-white/30 text-white' : 'bg-black/20 border-white/5 text-white/40 hover:text-white'}`}
          >
            {debugMode ? <Video size={18} /> : <VideoOff size={18} />}
          </button>
          <button 
             onClick={toggleAudio}
             className={`p-3 rounded-full backdrop-blur-md border transition-all ${audioEnabled ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-black/20 border-white/5 text-white/40 hover:text-white'}`}
          >
            {audioEnabled ? <Mic size={18} className="animate-pulse" /> : <MicOff size={18} />}
          </button>
          <button 
             onClick={() => setZenMode(true)}
             className="p-3 rounded-full bg-black/20 backdrop-blur-md border border-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
             title="Zen Mode"
          >
            <EyeOff size={18} />
          </button>
        </div>
      </div>

      {/* 2. Floating Dock (Bottom) */}
      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-20 transition-all duration-700 ${zenMode ? 'translate-y-32 opacity-0' : 'translate-y-0 opacity-100'}`}>
        <div className="flex flex-col items-center gap-4">
          
          {/* Main Controls */}
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-full p-2 pl-6 pr-2 shadow-2xl flex items-center gap-6">
             
             {/* Shape Selectors */}
             <div className="flex gap-1">
                {[
                  { id: ShapeType.SPHERE, icon: Box, label: 'Sphere' },
                  { id: ShapeType.HEART, icon: Heart, label: 'Heart' },
                  { id: ShapeType.VORTEX, icon: Wind, label: 'Vortex' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setShape(item.id)}
                    className={`p-3 rounded-full transition-all duration-300 relative group ${shape === item.id ? 'bg-white/10 text-white shadow-inner' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                  >
                    <item.icon size={20} />
                    {/* Tooltip */}
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      {item.label}
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => setShowDrawModal(true)}
                  className={`p-3 rounded-full transition-all duration-300 relative group ${shape === ShapeType.CUSTOM ? 'bg-gradient-to-tr from-purple-500/40 to-cyan-500/40 text-white border border-white/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                >
                  <PenTool size={20} />
                </button>
             </div>

             <div className="w-px h-8 bg-white/10" />

             {/* Color Palette */}
             <div className="flex gap-2 items-center">
                {['#00eaff', '#ff0055', '#a855f7', '#fbbf24', '#ffffff'].map((c) => (
                   <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-4 h-4 rounded-full transition-transform duration-300 ${color === c ? 'scale-150 ring-2 ring-white/50 ring-offset-2 ring-offset-black' : 'hover:scale-125 opacity-60 hover:opacity-100'}`}
                    style={{ backgroundColor: c, boxShadow: color === c ? `0 0 10px ${c}` : 'none' }}
                   />
                 ))}
                 <input 
                    type="color" 
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-6 h-6 rounded-full border-0 p-0 overflow-hidden cursor-pointer opacity-0 absolute w-8 ml-24" // Hack to hide input but keep clickable area
                 />
             </div>
             
             {/* Action Button */}
             <button 
                onClick={takeScreenshot}
                className="ml-2 bg-white text-black p-3 rounded-full hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                title="Save Screenshot"
             >
               <Camera size={20} />
             </button>
          </div>

          {/* Sliders (Sub-controls) */}
          <div className="flex gap-4 opacity-0 hover:opacity-100 transition-opacity duration-500 delay-150">
             <div className="bg-black/40 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-3 border border-white/5">
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Density</span>
                <input 
                  type="range" 
                  min="1000" 
                  max="10000" 
                  step="1000"
                  value={particleCount}
                  onChange={(e) => setParticleCount(Number(e.target.value))}
                  className="w-24 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer hover:bg-white/20 accent-white"
                />
             </div>
             <div className="bg-black/40 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-3 border border-white/5">
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Spread</span>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01"
                  value={openness}
                  onChange={(e) => {
                    setOpenness(parseFloat(e.target.value));
                    opennessRef.current = parseFloat(e.target.value);
                  }}
                  className="w-24 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer hover:bg-white/20 accent-white"
                />
             </div>
          </div>
        </div>
      </div>

      {/* 3. Zen Mode Exit Trigger */}
      {zenMode && (
        <button 
          onClick={() => setZenMode(false)}
          className="absolute top-6 right-6 z-50 text-white/20 hover:text-white transition-colors p-4"
        >
          <Eye size={24} />
        </button>
      )}

      {/* 4. Hand Visualizer (Corner) */}
      <div className={`absolute bottom-8 right-8 pointer-events-none z-10 transition-all duration-500 ${zenMode ? 'opacity-0 translate-y-10' : 'opacity-100'}`}>
         <div className="flex flex-col items-center gap-3">
             <div className="relative">
                <Hand 
                  size={32} 
                  className={`transition-all duration-300 ${openness > 0.6 ? 'text-cyan-400' : 'text-purple-500'}`} 
                  strokeWidth={1.5}
                />
                {/* Glow behind hand */}
                <div className={`absolute inset-0 blur-xl transition-all duration-300 ${openness > 0.6 ? 'bg-cyan-500/40' : 'bg-purple-500/40'}`} />
             </div>
             {/* Minimal Gauge */}
             <div className="h-32 w-1 bg-white/10 rounded-full overflow-hidden relative">
               <div 
                  className="absolute bottom-0 w-full bg-white shadow-[0_0_10px_white] transition-all duration-100 ease-out"
                  style={{ height: `${openness * 100}%` }}
               />
             </div>
         </div>
      </div>

      {/* Modals */}
      {showDrawModal && (
        <DrawingCanvas 
          onSave={handleCustomShape} 
          onClose={() => setShowDrawModal(false)} 
        />
      )}
    </div>
  );
}

export default App;