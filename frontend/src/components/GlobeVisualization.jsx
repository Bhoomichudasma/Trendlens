import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Globe component
const Globe = () => {
  const globeRef = useRef();
  
  // Create the wireframe geometry
  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1, 64);
    return geo;
  }, []);
  
  // Rotate the globe slowly
  useFrame((state, delta) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += delta * 0.15;
      globeRef.current.rotation.x += delta * 0.05;
    }
  });
  
  return (
    <mesh ref={globeRef} geometry={geometry}>
      <meshBasicMaterial 
        color="#a5f3fc" 
        wireframe={true} 
        transparent={true}
        opacity={0.3}
      />
    </mesh>
  );
};

// Network nodes component
const NetworkNodes = () => {
  const groupRef = useRef();
  
  // Create random nodes
  const nodes = useMemo(() => {
    const nodeList = [];
    for (let i = 0; i < 100; i++) {
      nodeList.push({
        id: i,
        position: [
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10
        ],
        scale: Math.random() * 0.05 + 0.01
      });
    }
    return nodeList;
  }, []);
  
  // Rotate the network slowly
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
    }
  });
  
  return (
    <group ref={groupRef}>
      {nodes.map((node) => (
        <mesh key={node.id} position={node.position} scale={[node.scale, node.scale, node.scale]}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial 
            color="#a5f3fc" 
            transparent={true}
            opacity={0.6}
          />
        </mesh>
      ))}
      
      {/* Connection lines */}
      {nodes.slice(0, 30).map((node, i) => {
        if (i < nodes.length - 1) {
          const nextNode = nodes[i + 1];
          return (
            <line key={`line-${i}`}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([
                    ...node.position,
                    ...nextNode.position
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial 
                color="#a5f3fc" 
                transparent={true}
                opacity={0.4}
              />
            </line>
          );
        }
        return null;
      })}
    </group>
  );
};

// Main visualization component
const GlobeVisualization = ({ type = 'globe' }) => {
  return (
    <div className="absolute inset-0 z-0 opacity-40">
      <Canvas camera={{ position: [0, 0, 2.5], fov: 75 }}>
        <ambientLight intensity={0.5} />
        {type === 'globe' ? <Globe /> : <NetworkNodes />}
      </Canvas>
    </div>
  );
};

export default GlobeVisualization;