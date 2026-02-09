import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Line, Points } from '@react-three/drei';
import * as THREE from 'three';

// Animated network nodes
const NetworkNodes: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });
  
  const nodes = [
    { pos: [0, 0, 0], color: '#00f0ff' },
    { pos: [2, 1, 0], color: '#7b61ff' },
    { pos: [-2, -1, 0], color: '#00ff88' },
    { pos: [1, -2, 1], color: '#ffaa00' },
    { pos: [-1, 2, -1], color: '#ff4444' },
  ];
  
  return (
    <group ref={groupRef}>
      {nodes.map((node, i) => (
        <Sphere key={i} args={[0.15, 16, 16]} position={node.pos as [number, number, number]}>
          <meshStandardMaterial 
            color={node.color} 
            emissive={node.color}
            emissiveIntensity={0.5}
          />
        </Sphere>
      ))}
      {/* Connection lines */}
      <Line 
        points={nodes.map(n => n.pos as [number, number, number])} 
        color="#1e1e2e" 
        lineWidth={1} 
      />
    </group>
  );
};

// Signal flow visualization
const SignalFlow: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  
  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.z += 0.01;
    }
  });
  
  const particleCount = 100;
  const positions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const r = 1.5 + Math.random() * 0.5;
    
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#00f0ff" transparent opacity={0.6} />
    </points>
  );
};

const TelemetryPanel: React.FC = () => {
  return (
    <div className="h-full w-full relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-2 bg-gradient-to-b from-cyber-dark/80 to-transparent">
        <h2 className="text-xs font-mono text-cyber-accent uppercase tracking-wider">
          3D Telemetry Visualization
        </h2>
      </div>
      
      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Suspense fallback={null}>
          <NetworkNodes />
          <SignalFlow />
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
      
      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none grid-bg opacity-20" />
    </div>
  );
};

export default TelemetryPanel;
