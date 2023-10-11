import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, Dpr, useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { OrthographicCamera, useGLTF } from '@react-three/drei'
import { Loader } from './Loader'
import { Nodes } from '../types'
import { useBreakpoint } from '../helper/breakpoint'

function Scene({ rotate = true, hovered, ...props }) {
  const mesh = useRef<any>()
  const {
    nodes: { Shape_0: shape },
  } = useGLTF('/button.gltf') as unknown as { nodes: Nodes }
  useFrame((_state, delta) => rotate && (mesh.current.rotation.y += delta))

  // This ensures the rotation happens around the center.
  useEffect(() => {
    mesh.current.geometry.computeBoundingBox()
    const { boundingBox } = mesh.current.geometry
    const center = new Vector3()
    boundingBox.getCenter(center)
    mesh.current.geometry.translate(-center.x, -center.y, -center.z)
  })

  return (
    <group {...props} dispose={null}>
      <group name="github" position={[0, 0, 0]} rotation={[0, 0, 0]} scale={[-0.25, 0.25, 0.25]}>
        <mesh
          ref={mesh}
          geometry={shape.geometry}
          material={shape.material}
          castShadow
          receiveShadow
          position={[0, 0, 0]}
          rotation={[0, 0, 0]}
          scale={[-1, 1, 1]}
        />
      </group>
      <directionalLight
        name="Directional Light"
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
      <hemisphereLight
        name="Default Ambient Light"
        intensity={0.75}
        color={hovered ? '#000000' : '#eaeaea'}
      />
    </group>
  )
}

export function GitHubButton({ quality = 1, rotate = false }: { quality?: Dpr; rotate?: boolean }) {
  const [hovered, setHover] = useState(false)
  const [active, setActive] = useState(false)
  const { mobile } = useBreakpoint()

  return (
    <button
      type="button"
      style={{
        border: 'none',
        outline: 'none',
        background: 'none',
        cursor: 'pointer',
        padding: 0,
        width: mobile ? 50 : 100,
        height: mobile ? 50 : 100,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => {
        setActive(!active)
        window.open('https://github.com/tobua/numic', '_blank')
      }}
    >
      <Canvas dpr={quality}>
        <Suspense fallback={<Loader spinner />}>
          <Scene hovered={hovered} rotate={rotate} />
          <OrthographicCamera
            name="1"
            makeDefault
            zoom={1}
            far={100000}
            near={-100000}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            scale={mobile ? 6 : 3}
          />
        </Suspense>
      </Canvas>
    </button>
  )
}
