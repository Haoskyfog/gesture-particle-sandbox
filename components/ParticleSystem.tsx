import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ShapeType } from '../types';
import { audioService } from '../services/audio';

// Fix for missing JSX types
declare global {
  namespace JSX {
    interface IntrinsicElements {
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      pointsMaterial: any;
    }
  }
}

interface ParticleSystemProps {
  count: number;
  shape: ShapeType;
  opennessRef: React.MutableRefObject<number>;
  color: string;
  customPoints: Float32Array | null;
  audioEnabled: boolean;
}

export const ParticleSystem: React.FC<ParticleSystemProps> = ({ 
  count, 
  shape, 
  opennessRef, 
  color,
  customPoints,
  audioEnabled
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Generate a soft glow texture procedurally
  const particleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.4, 'rgba(255,255,255,0.5)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);
    }
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  const targets = useMemo(() => {
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      let x = 0, y = 0, z = 0;
      const i3 = i * 3;

      if (shape === ShapeType.CUSTOM && customPoints && customPoints.length > 0) {
        const randIdx = Math.floor(Math.random() * (customPoints.length / 3)) * 3;
        x = (customPoints[randIdx] - 0.5) * 12;
        y = -(customPoints[randIdx + 1] - 0.5) * 12;
        z = (Math.random() - 0.5) * 2;
      } else if (shape === ShapeType.HEART) {
        const phi = Math.random() * Math.PI * 2;
        const t = phi;
        const r = (Math.random() * 0.2 + 0.8);
        x = r * 16 * Math.pow(Math.sin(t), 3);
        y = r * (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
        z = (Math.random() - 0.5) * 8;
        x *= 0.25; y *= 0.25; z *= 0.25;
      } else if (shape === ShapeType.VORTEX) {
        const angle = Math.random() * Math.PI * 2 * 3;
        const radius = Math.random() * 6 + 0.5;
        const armOffset = (Math.random() - 0.5) * 2.0;
        x = Math.cos(angle + armOffset) * radius;
        z = Math.sin(angle + armOffset) * radius;
        y = (Math.random() - 0.5) * (5 - radius * 0.5);
      } else {
        // SPHERE
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = 5.5 * Math.cbrt(Math.random());
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi);
      }
      data[i3] = x;
      data[i3 + 1] = y;
      data[i3 + 2] = z;
    }
    return data;
  }, [count, shape, customPoints]);

  const randoms = useMemo(() => {
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      data[i] = (Math.random() - 0.5) * 35; // Wider scatter
    }
    return data;
  }, [count]);

  const positions = useMemo(() => new Float32Array(count * 3), [count]);
  
  // Store velocities for organic movement
  const velocities = useMemo(() => {
    const data = new Float32Array(count * 3);
    for(let i=0; i<count*3; i++) data[i] = 0;
    return data;
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    
    const time = state.clock.getElapsedTime();
    const currentOpenness = opennessRef.current;
    
    // Audio Analysis
    let bass = 0, mid = 0;
    if (audioEnabled) {
      const freqs = audioService.getFrequencyData();
      bass = freqs.bass; // 0 to 1
      mid = freqs.mid;
    }

    // Material Pulse
    const material = pointsRef.current.material as THREE.PointsMaterial;
    // Base size + Openness effect + Audio Bass punch
    const targetSize = 0.15 + (currentOpenness * 0.1) + (bass * 0.4);
    material.size = THREE.MathUtils.lerp(material.size, targetSize, 0.1);

    const posAttribute = pointsRef.current.geometry.attributes.position;
    
    // Dynamic Rotation Speed based on Fist (congregate) vs Palm (open)
    // Spin faster when condensed (conservation of angular momentum style)
    const rotationSpeed = 0.001 + (1 - currentOpenness) * 0.005 + (mid * 0.01);
    pointsRef.current.rotation.y += rotationSpeed;
    pointsRef.current.rotation.z += (1 - currentOpenness) * 0.001;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      const tx = targets[i3];
      const ty = targets[i3 + 1];
      const tz = targets[i3 + 2];
      
      const rx = randoms[i3];
      const ry = randoms[i3 + 1];
      const rz = randoms[i3 + 2];

      const cx = positions[i3];
      const cy = positions[i3 + 1];
      const cz = positions[i3 + 2];

      // Audio Displacement (Jitter)
      const audioJitter = audioEnabled ? (Math.sin(time * 10 + i) * mid * 2) : 0;
      
      // Calculate Goal Position
      // Openness 0: Shape
      // Openness 1: Chaos
      let goalX = THREE.MathUtils.lerp(tx, rx, currentOpenness);
      let goalY = THREE.MathUtils.lerp(ty, ry, currentOpenness);
      let goalZ = THREE.MathUtils.lerp(tz, rz, currentOpenness);

      // Add breathing/orbiting noise
      const noiseAmp = 0.2 + (currentOpenness * 2) + (bass * 1);
      const noiseX = Math.sin(time * 0.5 + i * 0.1) * noiseAmp;
      const noiseY = Math.cos(time * 0.3 + i * 0.2) * noiseAmp;
      
      goalX += noiseX + audioJitter;
      goalY += noiseY + audioJitter;
      goalZ += audioJitter;

      // Physics: Spring/Lerp
      // Using velocity for smoother, heavier feel
      const stiffness = 0.02 + (bass * 0.05); // React faster to bass
      const friction = 0.90; // Inertia

      const vx = velocities[i3] * friction + (goalX - cx) * stiffness;
      const vy = velocities[i3 + 1] * friction + (goalY - cy) * stiffness;
      const vz = velocities[i3 + 2] * friction + (goalZ - cz) * stiffness;

      velocities[i3] = vx;
      velocities[i3 + 1] = vy;
      velocities[i3 + 2] = vz;

      positions[i3] += vx;
      positions[i3 + 1] += vy;
      positions[i3 + 2] += vz;
    }

    posAttribute.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        map={particleTexture}
        size={0.2}
        color={color}
        transparent
        opacity={0.9}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};