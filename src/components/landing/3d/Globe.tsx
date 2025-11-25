import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export const Globe = () => {
    const groupRef = useRef<THREE.Group>(null);

    // Generate points for Agents (Purple) and Humans (Cyan)
    const { nodes, connections } = useMemo(() => {
        const count = 50; // Number of nodes
        const radius = 2.5;
        const nodesArray = [];
        const connectionsArray = [];

        // Generate random points on a sphere
        for (let i = 0; i < count; i++) {
            const phi = Math.acos(-1 + (2 * i) / count);
            const theta = Math.sqrt(count * Math.PI) * phi;

            const x = radius * Math.cos(theta) * Math.sin(phi);
            const y = radius * Math.sin(theta) * Math.sin(phi);
            const z = radius * Math.cos(phi);

            nodesArray.push(new THREE.Vector3(x, y, z));
        }

        // Create connections between close nodes
        for (let i = 0; i < count; i++) {
            for (let j = i + 1; j < count; j++) {
                const dist = nodesArray[i].distanceTo(nodesArray[j]);
                if (dist < 1.5) { // Connection threshold
                    connectionsArray.push(nodesArray[i]);
                    connectionsArray.push(nodesArray[j]);
                }
            }
        }

        return { nodes: nodesArray, connections: connectionsArray };
    }, []);

    const agentsPositions = useMemo(() => new Float32Array(nodes.slice(0, 25).flatMap(v => [v.x, v.y, v.z])), [nodes]);
    const humansPositions = useMemo(() => new Float32Array(nodes.slice(25).flatMap(v => [v.x, v.y, v.z])), [nodes]);
    const lineGeometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(connections), [connections]);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.001;
            groupRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.05;
        }
    });

    return (
        <group ref={groupRef}>
            {/* Agents (Purple Nodes) */}
            <points>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[agentsPositions, 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    transparent
                    color="#8B5CF6"
                    size={0.15}
                    sizeAttenuation={true}
                    depthWrite={false}
                />
            </points>

            {/* Humans (Cyan Nodes) */}
            <points>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[humansPositions, 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    transparent
                    color="#06B6D4"
                    size={0.15}
                    sizeAttenuation={true}
                    depthWrite={false}
                />
            </points>

            {/* Connections */}
            <lineSegments geometry={lineGeometry}>
                <lineBasicMaterial
                    color="white"
                    opacity={0.1}
                    transparent
                    linewidth={1}
                />
            </lineSegments>

            {/* Inner Sphere for depth */}
            <mesh scale={2.4}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshBasicMaterial color="#000" opacity={0.5} transparent />
            </mesh>
        </group>
    );
};
