import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Modernized Globe — particle-based network visualization
 * Glowing nodes, animated connection pulses, orbital rings
 */

// Shader for glowing particles
const particleVertexShader = `
  attribute float size;
  attribute vec3 customColor;
  attribute float pulse;
  varying vec3 vColor;
  varying float vPulse;
  uniform float time;

  void main() {
    vColor = customColor;
    vPulse = pulse;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z) * (1.0 + 0.15 * sin(time * 2.0 + pulse * 6.28));
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const particleFragmentShader = `
  varying vec3 vColor;
  varying float vPulse;
  uniform float time;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    // Soft glow falloff
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha *= 0.8 + 0.2 * sin(time * 3.0 + vPulse * 6.28);

    // Core brightness
    float core = 1.0 - smoothstep(0.0, 0.15, dist);
    vec3 color = mix(vColor, vec3(1.0), core * 0.6);

    gl_FragColor = vec4(color, alpha);
  }
`;

// Shader for animated connection lines
const lineVertexShader = `
  attribute float lineProgress;
  varying float vProgress;
  uniform float time;

  void main() {
    vProgress = lineProgress;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const lineFragmentShader = `
  varying float vProgress;
  uniform float time;
  uniform vec3 lineColor;

  void main() {
    // Traveling pulse along the line
    float pulse = sin((vProgress - time * 0.5) * 12.0) * 0.5 + 0.5;
    float alpha = 0.06 + pulse * 0.12;
    gl_FragColor = vec4(lineColor, alpha);
  }
`;

export const Globe = () => {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);

  const purple = new THREE.Color("#A78BFA");
  const cyan = new THREE.Color("#67E8F9");
  const white = new THREE.Color("#E2E8F0");

  // Generate nodes and connections
  const { particleGeometry, lineGeometry, lineProgressAttr } = useMemo(() => {
    const count = 60;
    const radius = 2.8;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const pulses = new Float32Array(count);
    const nodes: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;

      // Add slight randomness for organic feel
      const r = radius + (Math.random() - 0.5) * 0.3;
      const x = r * Math.cos(theta) * Math.sin(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Color: mix of purple, cyan, white
      const color = Math.random() < 0.3 ? purple : Math.random() < 0.5 ? cyan : white;
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 3 + Math.random() * 4;
      pulses[i] = Math.random();

      nodes.push(new THREE.Vector3(x, y, z));
    }

    const pGeom = new THREE.BufferGeometry();
    pGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pGeom.setAttribute("customColor", new THREE.BufferAttribute(colors, 3));
    pGeom.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    pGeom.setAttribute("pulse", new THREE.BufferAttribute(pulses, 1));

    // Connections
    const connectionPositions: number[] = [];
    const progressValues: number[] = [];

    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dist = nodes[i].distanceTo(nodes[j]);
        if (dist < 2.0) {
          connectionPositions.push(nodes[i].x, nodes[i].y, nodes[i].z);
          connectionPositions.push(nodes[j].x, nodes[j].y, nodes[j].z);
          progressValues.push(0, 1);
        }
      }
    }

    const lGeom = new THREE.BufferGeometry();
    lGeom.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(connectionPositions, 3)
    );
    const lpAttr = new THREE.Float32BufferAttribute(progressValues, 1);
    lGeom.setAttribute("lineProgress", lpAttr);

    return { particleGeometry: pGeom, lineGeometry: lGeom, lineProgressAttr: lpAttr };
  }, []);

  // Uniforms
  const particleUniforms = useMemo(
    () => ({ time: { value: 0 } }),
    []
  );

  const lineUniforms = useMemo(
    () => ({
      time: { value: 0 },
      lineColor: { value: new THREE.Color("#A78BFA") },
    }),
    []
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0008;
      groupRef.current.rotation.x = Math.sin(t * 0.08) * 0.04;
    }

    particleUniforms.time.value = t;
    lineUniforms.time.value = t;

    // Subtle ring rotation
    if (ringRef1.current) {
      ringRef1.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.15) * 0.1;
      ringRef1.current.rotation.z = t * 0.05;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.x = Math.PI / 3 + Math.cos(t * 0.12) * 0.08;
      ringRef2.current.rotation.z = -t * 0.03;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Particle nodes */}
      <points ref={particlesRef} geometry={particleGeometry}>
        <shaderMaterial
          vertexShader={particleVertexShader}
          fragmentShader={particleFragmentShader}
          uniforms={particleUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Animated connection lines */}
      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <shaderMaterial
          vertexShader={lineVertexShader}
          fragmentShader={lineFragmentShader}
          uniforms={lineUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* Orbital ring 1 */}
      <mesh ref={ringRef1}>
        <torusGeometry args={[3.2, 0.008, 16, 100]} />
        <meshBasicMaterial color="#A78BFA" opacity={0.25} transparent />
      </mesh>

      {/* Orbital ring 2 */}
      <mesh ref={ringRef2}>
        <torusGeometry args={[3.6, 0.006, 16, 100]} />
        <meshBasicMaterial color="#67E8F9" opacity={0.15} transparent />
      </mesh>

      {/* Inner atmosphere sphere */}
      <mesh scale={2.4}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial
          color="#0F0A1A"
          opacity={0.7}
          transparent
          side={THREE.BackSide}
        />
      </mesh>

      {/* Outer glow sphere */}
      <mesh scale={3.0}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#A78BFA"
          opacity={0.03}
          transparent
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
};
