import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import {
  AdditiveBlending,
  Color,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  PointLight as ThreePointLight,
} from 'three'

export interface ItemProps {
  position?: [number, number, number]
  scale?: number
}

const RAINBOW_COLORS = [
  new Color('#ff2d55'),
  new Color('#ff7a18'),
  new Color('#ffd60a'),
  new Color('#32d74b'),
  new Color('#0a84ff'),
  new Color('#5e5ce6'),
  new Color('#bf5af2'),
]

export const Item: React.FC<ItemProps> = ({ position = [0, 0, 0], scale = 1 }) => {
  const groupRef = useRef<Group>(null)
  const crystalRef = useRef<Mesh>(null)
  const crystalMaterialRef = useRef<MeshPhysicalMaterial>(null)
  const auraMeshRefs = useRef<Array<Mesh | null>>([])
  const auraMaterialRefs = useRef<Array<MeshPhysicalMaterial | null>>([])
  const accentLightRefs = useRef<Array<ThreePointLight | null>>([])
  const coreLightRef = useRef<ThreePointLight>(null)
  const underGlowRef = useRef<ThreePointLight>(null)
  const animatedCoreColor = useRef(new Color())

  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime()

    if (crystalRef.current) {
      crystalRef.current.rotation.y += delta * 0.5
      crystalRef.current.rotation.x = Math.sin(elapsed * 0.8) * 0.08

      const pulse = 1 + Math.sin(elapsed * 3.4) * 0.04
      crystalRef.current.scale.setScalar(pulse)
    }

    if (crystalMaterialRef.current) {
      crystalMaterialRef.current.emissiveIntensity = 1.8 + Math.sin(elapsed * 3.4) * 0.35
    }

    auraMeshRefs.current.forEach((mesh, index) => {
      if (!mesh) return

      const angle = elapsed * (0.55 + index * 0.03) + index * ((Math.PI * 2) / RAINBOW_COLORS.length)
      const wobble = Math.sin(elapsed * 2.8 + index) * 0.025

      mesh.rotation.x = angle * 0.35
      mesh.rotation.y = -angle * 0.9
      mesh.rotation.z = Math.sin(angle) * 0.25
      mesh.position.set(Math.cos(angle) * 0.04, 0.8 + wobble, Math.sin(angle) * 0.04)

      const scaleOffset = 1.02 + index * 0.035 + Math.sin(elapsed * 2 + index) * 0.015
      mesh.scale.setScalar(scaleOffset)
    })

    auraMaterialRefs.current.forEach((material, index) => {
      if (!material) return

      material.opacity = 0.16 + index * 0.012 + (Math.sin(elapsed * 4 + index) + 1) * 0.02
      material.emissiveIntensity = 2.4 + Math.sin(elapsed * 3 + index) * 0.4
    })

    accentLightRefs.current.forEach((light, index) => {
      if (!light) return

      const angle = elapsed * 0.85 + index * ((Math.PI * 2) / RAINBOW_COLORS.length)
      light.position.set(
        Math.cos(angle) * 0.7,
        0.85 + Math.sin(elapsed * 1.7 + index) * 0.18,
        Math.sin(angle) * 0.7,
      )
      light.intensity = 0.9 + (Math.sin(elapsed * 3.2 + index) + 1) * 0.35
    })

    if (coreLightRef.current) {
      const cycle = (elapsed * 0.9) % RAINBOW_COLORS.length
      const baseIndex = Math.floor(cycle)
      const nextIndex = (baseIndex + 1) % RAINBOW_COLORS.length
      const blend = cycle - baseIndex

      animatedCoreColor.current.copy(RAINBOW_COLORS[baseIndex]).lerp(RAINBOW_COLORS[nextIndex], blend)
      coreLightRef.current.color.copy(animatedCoreColor.current)
      coreLightRef.current.intensity = 6.5 + Math.sin(elapsed * 4.2) * 0.8
    }

    if (underGlowRef.current) {
      underGlowRef.current.intensity = 3 + (Math.sin(elapsed * 2.6) + 1) * 0.45
    }
  })

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* 台座 */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.4, 0.5, 0.3, 8]} />
          <meshStandardMaterial
            color="#1c1f2b"
            emissive="#101421"
            emissiveIntensity={0.8}
            metalness={0.82}
            roughness={0.22}
          />
        </mesh>
      </RigidBody>

      {/* クリスタル本体（回転） */}
      <mesh ref={crystalRef} position={[0, 0.8, 0]} castShadow>
        <octahedronGeometry args={[0.4]} />
        <meshPhysicalMaterial
          ref={crystalMaterialRef}
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={1.8}
          metalness={0.1}
          roughness={0.02}
          transmission={0.1}
          thickness={0.9}
          clearcoat={1}
          clearcoatRoughness={0.05}
          transparent
          opacity={0.72}
        />
      </mesh>

      {RAINBOW_COLORS.map((color, index) => (
        <mesh
          key={color.getHexString()}
          ref={(mesh) => {
            auraMeshRefs.current[index] = mesh
          }}
          position={[0, 0.8, 0]}
        >
          <octahedronGeometry args={[0.4]} />
          <meshPhysicalMaterial
            ref={(material) => {
              auraMaterialRefs.current[index] = material
            }}
            color={color}
            emissive={color}
            emissiveIntensity={2.4}
            transparent
            opacity={0.18}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}

      <pointLight
        ref={coreLightRef}
        position={[0, 0.8, 0]}
        color="#ffffff"
        intensity={6.5}
        distance={5.5}
        decay={1.6}
        castShadow
        shadow-bias={-0.0004}
      />

      <pointLight
        ref={underGlowRef}
        position={[0, 0.25, 0]}
        color="#7df9ff"
        intensity={3}
        distance={3.4}
        decay={2}
      />

      {RAINBOW_COLORS.map((color, index) => (
        <pointLight
          key={`${color.getHexString()}-light`}
          ref={(light) => {
            accentLightRefs.current[index] = light
          }}
          color={color}
          intensity={1.2}
          distance={2.6}
          decay={2.2}
        />
      ))}
    </group>
  )
}
