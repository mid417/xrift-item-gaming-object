import { useLayoutEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import {
  AdditiveBlending,
  Color,
  DynamicDrawUsage,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  Object3D,
  PointLight as ThreePointLight,
} from 'three'

const RAINBOW_COLORS = [
  new Color('#ff3b6b'),
  new Color('#ff8a00'),
  new Color('#ffe45e'),
  new Color('#6fffe9'),
  new Color('#4d96ff'),
  new Color('#b892ff'),
]

export interface ItemProps {
  position?: [number, number, number]
  scale?: number
}

export const Item: React.FC<ItemProps> = ({ position = [0, 0, 0], scale = 1 }) => {
  const groupRef = useRef<Group>(null)
  const crystalRef = useRef<Mesh>(null)
  const crystalMaterialRef = useRef<MeshPhysicalMaterial>(null)
  const auraRef = useRef<InstancedMesh>(null)
  const auraMaterialRef = useRef<MeshBasicMaterial>(null)
  const auraTransformRef = useRef(new Object3D())
  const coreLightRef = useRef<ThreePointLight>(null)
  const underGlowRef = useRef<ThreePointLight>(null)
  const animatedCoreColor = useRef(new Color())

  useLayoutEffect(() => {
    if (!auraRef.current) return

    auraRef.current.instanceMatrix.setUsage(DynamicDrawUsage)

    RAINBOW_COLORS.forEach((color, index) => {
      auraRef.current?.setColorAt(index, color)
    })

    if (auraRef.current.instanceColor) {
      auraRef.current.instanceColor.needsUpdate = true
    }
  }, [])

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

    if (auraRef.current) {
      const auraTransform = auraTransformRef.current

      RAINBOW_COLORS.forEach((_, index) => {
        const angle = elapsed * (0.55 + index * 0.03) + index * ((Math.PI * 2) / RAINBOW_COLORS.length)
        const wobble = Math.sin(elapsed * 2.8 + index) * 0.025

        auraTransform.position.set(Math.cos(angle) * 0.04, 0.8 + wobble, Math.sin(angle) * 0.04)
        auraTransform.rotation.set(angle * 0.35, -angle * 0.9, Math.sin(angle) * 0.25)

        const scaleOffset = 1.02 + index * 0.035 + Math.sin(elapsed * 2 + index) * 0.015
        auraTransform.scale.setScalar(scaleOffset)
        auraTransform.updateMatrix()
        auraRef.current?.setMatrixAt(index, auraTransform.matrix)
      })

      auraRef.current.instanceMatrix.needsUpdate = true
    }

    if (auraMaterialRef.current) {
      auraMaterialRef.current.opacity = 0.18 + (Math.sin(elapsed * 4) + 1) * 0.02
    }

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
          <meshStandardMaterial color="#555555" metalness={0.6} roughness={0.3} />
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
          transparent
          opacity={0.85}
        />
      </mesh>

      <instancedMesh ref={auraRef} args={[undefined, undefined, RAINBOW_COLORS.length]}>
        <octahedronGeometry args={[0.4]} />
        <meshBasicMaterial
          ref={auraMaterialRef}
          vertexColors
          transparent
          opacity={0.18}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>

      <pointLight
        ref={coreLightRef}
        position={[0, 0.8, 0]}
        color="#ffffff"
        intensity={6.5}
        distance={5.5}
        decay={1.6}
      />

      <pointLight
        ref={underGlowRef}
        position={[0, 0.25, 0]}
        color="#7df9ff"
        intensity={3}
        distance={3.4}
        decay={2}
      />

    </group>
  )
}
