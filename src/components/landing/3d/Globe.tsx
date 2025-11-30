import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

export const Globe = () => {
    const groupRef = useRef<THREE.Group>(null);

    // Emoji sets
    const humanEmojis = ['🧑‍💻', '👩‍💻', '👨‍💻', '🧑', '👩', '👨', '💼', '🚀'];
    const robotEmojis = ['🤖', '🦾', '🦿', '⚡', '🔌'];

    // Generate points and assign emojis
    const { nodes, connections } = useMemo(() => {
        const count = 40; // Slightly reduced count for better visibility of emojis
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

            // Determine if this node is a robot or human (30% robots)
            const isRobot = Math.random() < 0.3;
            const emoji = isRobot
                ? robotEmojis[Math.floor(Math.random() * robotEmojis.length)]
                : humanEmojis[Math.floor(Math.random() * humanEmojis.length)];

            nodesArray.push({
                position: new THREE.Vector3(x, y, z),
                emoji,
                isRobot
            });
        }

        // Create connections between close nodes
        for (let i = 0; i < count; i++) {
            for (let j = i + 1; j < count; j++) {
                const dist = nodesArray[i].position.distanceTo(nodesArray[j].position);
                if (dist < 1.8) { // Connection threshold
                    connectionsArray.push(nodesArray[i].position);
                    connectionsArray.push(nodesArray[j].position);
                }
            }
        }

        return { nodes: nodesArray, connections: connectionsArray };
    }, []);

    const lineGeometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(connections), [connections]);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.001;
            groupRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.05;
        }
    });

    return (
        <group ref={groupRef}>
            {/* Nodes as Emojis */}
            {nodes.map((node, i) => (
                <Text
                    key={i}
                    position={node.position}
                    fontSize={0.25}
                    color={node.isRobot ? "#A78BFA" : "#67E8F9"} // Tint the emojis slightly or just let them be natural
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.01}
                    outlineColor="#000000"
                >
                    {node.emoji}
                </Text>
            ))}

            {/* Connections */}
            <lineSegments geometry={lineGeometry}>
                <lineBasicMaterial
                    color="white"
                    opacity={0.15}
                    transparent
                    linewidth={1}
                />
            </lineSegments>

            {/* Inner Sphere for depth */}
            <mesh scale={2.2}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshBasicMaterial color="#000" opacity={0.6} transparent />
            </mesh>
        </group>
    );
};
