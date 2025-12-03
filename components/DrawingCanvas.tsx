import React, { useRef, useEffect, useState } from 'react';
import { Trash2, Check, PenTool } from 'lucide-react';

// Fix for missing JSX types
declare global {
  namespace JSX {
    interface IntrinsicElements {
      div: any;
      canvas: any;
      h3: any;
      button: any;
      p: any;
    }
  }
}

interface DrawingCanvasProps {
  onSave: (points: Float32Array) => void;
  onClose: () => void;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onSave, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const c = canvasRef.current;
      c.width = 300;
      c.height = 300;
      const context = c.getContext('2d');
      if (context) {
        context.fillStyle = 'black';
        context.fillRect(0, 0, 300, 300);
        context.strokeStyle = 'white';
        context.lineWidth = 15;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        setCtx(context);
      }
    }
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const { x, y } = getPos(e);
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !ctx) return;
    e.preventDefault(); // Prevent scrolling on touch
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    ctx?.closePath();
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    const imageData = ctx?.getImageData(0, 0, 300, 300);
    if (!imageData) return;
    
    const points: number[] = [];
    const data = imageData.data;
    // Sample pixels
    for (let y = 0; y < 300; y += 2) { // Step 2 for performance
      for (let x = 0; x < 300; x += 2) {
        const i = (y * 300 + x) * 4;
        // If pixel is bright enough
        if (data[i] > 50) {
          // Normalize to 0-1
          points.push(x / 300);
          points.push(y / 300);
          points.push(0); // Z is 0 for 2D drawing
        }
      }
    }
    onSave(new Float32Array(points));
    onClose();
  };

  const handleClear = () => {
    if (ctx) {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, 300, 300);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 p-6 rounded-2xl border border-gray-700 shadow-2xl flex flex-col gap-4">
        <div className="flex justify-between items-center text-white mb-2">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <PenTool size={20} /> Draw Custom Shape
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        
        <canvas 
          ref={canvasRef}
          className="border-2 border-gray-600 rounded cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        <div className="flex gap-4">
          <button 
            onClick={handleClear}
            className="flex-1 py-2 px-4 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 flex items-center justify-center gap-2 font-semibold"
          >
            <Trash2 size={18} /> Clear
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 py-2 px-4 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 flex items-center justify-center gap-2 font-semibold"
          >
            <Check size={18} /> Use Shape
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center">Draw anything! White pixels become particles.</p>
      </div>
    </div>
  );
};