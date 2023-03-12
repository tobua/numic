import React, { Suspense } from 'react'
import { Canvas, Dpr, GroupProps, useFrame } from '@react-three/fiber'
import { PerformanceMonitor, PerspectiveCamera, useGLTF } from '@react-three/drei'
import { Vector3 } from 'three'
import { damp3 } from 'maath/easing'
import { SceneItems } from './Items'
import { Nodes } from '../types'
import { Loader } from './Loader'
import { Performance } from './Quality'

const itemPositions = {
  android: new Vector3(-200, 0, 300),
  apple: new Vector3(100, 200, -200),
  iphone: new Vector3(400, 400, -400),
  react: new Vector3(900, 800, -900),
}

const cameraTargetPosition = {
  patch: new Vector3(0, 100, 1000),
  plugin: new Vector3(500, 200, 500),
  update: new Vector3(600, 400, 200),
  migration: new Vector3(600, 400, 200),
}

const cameraLookAtPosition = {
  patch: itemPositions.android.add(new Vector3(0, 0, 0)),
  plugin: itemPositions.apple,
  update: itemPositions.iphone,
  migration: itemPositions.react,
}

let currentCameraLookAtPosition = {
  feature: 'patch',
  position: new Vector3(
    cameraLookAtPosition.patch.x,
    cameraLookAtPosition.patch.y,
    cameraLookAtPosition.patch.z
  ),
}

function Story({
  feature,
  previousFeature,
  ...props
}: {
  feature: string
  previousFeature: string
} & GroupProps) {
  const { nodes } = useGLTF('/scene.gltf') as unknown as { nodes: Nodes }

  useFrame(({ camera }, delta) => {
    // Move camera slowly to new feature position.
    camera.position.lerp(cameraTargetPosition[feature], 0.01)
    // Reset camera look at position on feature change.
    if (currentCameraLookAtPosition.feature !== feature) {
      currentCameraLookAtPosition.feature = feature
      const newLookAtPosition = cameraLookAtPosition[previousFeature]
      currentCameraLookAtPosition.position = new Vector3(
        newLookAtPosition.x,
        newLookAtPosition.y,
        newLookAtPosition.z
      )
    }
    damp3(currentCameraLookAtPosition.position, cameraLookAtPosition[feature], 1, delta)
    camera.lookAt(currentCameraLookAtPosition.position)
  })

  return (
    <group position={[0, -120, 0]} {...props} dispose={null}>
      <PerspectiveCamera
        makeDefault={true}
        far={8000}
        near={5}
        fov={45}
        position={cameraTargetPosition.patch}
      />
      <SceneItems.Android
        nodes={nodes}
        position={itemPositions.android}
        rotation={[0, 0.3, 0]}
        float
      />
      <SceneItems.Apple
        position={itemPositions.apple}
        nodes={nodes}
        active={feature !== 'patch'}
        rings
      />
      <SceneItems.iPhone position={itemPositions.iphone} nodes={nodes} />
      <SceneItems.React
        position={itemPositions.react}
        nodes={nodes}
        rotate={feature === 'migration'}
      />
    </group>
  )
}

export function Scene({
  feature,
  previousFeature,
  quality = 1,
}: { quality?: Dpr; feature: string; previousFeature: string } & GroupProps) {
  return (
    <div
      style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1 }}
    >
      <Canvas shadows flat linear dpr={quality}>
        <PerformanceMonitor
          onChange={({ fps }) => {
            Performance.fps = fps
          }}
        />
        <Suspense fallback={<Loader />}>
          <Story feature={feature} previousFeature={previousFeature} />
          <mesh receiveShadow rotation={[-Math.PI * 0.5, 0, 0]} position={[0, -300, 0]}>
            <planeGeometry args={[2000, 2000]} />
            <shadowMaterial opacity={0.2} />
          </mesh>
          <directionalLight
            castShadow
            intensity={0.7}
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-near={-10000}
            shadow-camera-far={100000}
            shadow-camera-left={-500}
            shadow-camera-right={500}
            shadow-camera-top={500}
            shadow-camera-bottom={-500}
            position={[200, 300, 300]}
          />
          <hemisphereLight intensity={0.3} color="#FFFFFF" />
        </Suspense>
      </Canvas>
    </div>
  )
}
