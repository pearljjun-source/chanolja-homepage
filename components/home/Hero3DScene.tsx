'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'

// 원형 텍스처 생성
function createCircleTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')!

  // 원형 그라데이션
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(60, 191, 220, 1)')
  gradient.addColorStop(0.5, 'rgba(60, 191, 220, 0.5)')
  gradient.addColorStop(1, 'rgba(60, 191, 220, 0)')

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(32, 32, 32, 0, Math.PI * 2)
  ctx.fill()

  const texture = new THREE.CanvasTexture(canvas)
  return texture
}

// 파티클 배경 - 좌우로 넓게 분포, 원 모양
function Particles({ count = 200 }) {
  const mesh = useRef<THREE.Points>(null)

  const [particles, circleTexture] = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // 좌우로 넓게 분포
      positions[i * 3] = (Math.random() - 0.5) * 25
      // 상하
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12
      // 깊이 - 카메라 앞에 배치
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2
      // 랜덤 크기
      sizes[i] = Math.random() * 0.5 + 0.2
    }

    const texture = createCircleTexture()
    return [{ positions, sizes }, texture]
  }, [count])

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.elapsedTime * 0.02
    }
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.positions.length / 3}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particles.sizes.length}
          array={particles.sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        map={circleTexture}
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// 메인 3D Scene - 파티클만
function Scene() {
  return (
    <>
      <Particles count={200} />
    </>
  )
}

export default function Hero3DScene() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene />
      </Canvas>
    </div>
  )
}
