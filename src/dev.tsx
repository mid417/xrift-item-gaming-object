/**
 * 開発環境用エントリーポイント
 *
 * ローカル開発時（npm run dev）に使用されます。
 * 本番ビルド（npm run build）では使用されません。
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { OrbitControls } from '@react-three/drei'
import { Item } from './Item'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

createRoot(rootElement).render(
  <StrictMode>
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'radial-gradient(circle at top, #18233f 0%, #090b13 55%, #020305 100%)',
      }}
    >
      <Canvas shadows camera={{ position: [3.2, 2.8, 3.4], fov: 50 }}>
        <Physics>
          <color attach="background" args={['#05070d']} />
          <fog attach="fog" args={['#05070d', 5, 11]} />
          <ambientLight intensity={0.18} />
          <directionalLight
            position={[5, 5, 5]}
            intensity={0.45}
            castShadow
          />
          <Item position={[0, 0, 0]} />
          {/* 地面 */}
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[10, 10]} />
            <meshStandardMaterial
              color="#121826"
              metalness={0.45}
              roughness={0.72}
            />
          </mesh>
          <OrbitControls />
        </Physics>
      </Canvas>
    </div>
  </StrictMode>,
)
