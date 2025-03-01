import { useRef } from 'react'
import { Vector3, useFrame } from '@react-three/fiber'
import { Nodes } from '../../types'
import { Color } from '../../style'
import { useRefs } from '../../helper/refs'
import { MeshReflectorMaterial } from '@react-three/drei'

export function React({
  nodes,
  position,
  rotate = false,
}: {
  nodes: Nodes
  position?: Vector3
  rotate?: boolean
}) {
  const group = useRef<any>(null)
  const dot = useRef<any>(null)
  const [firstDot, secondDot, thirdDot] = useRefs<any>(null)

  useFrame((state, delta) => {
    if (!rotate) {
      return
    }

    // Rotate whole thing.
    group.current.rotation.z -= delta / 4

    // Move atoms.
    const radius = 185
    const speed = 1
    const time = state.clock.getElapsedTime() * speed
    firstDot.current.position.set(
      Math.sin(time) * radius,
      (Math.cos(time) * radius * Math.atan(time)) / Math.PI / 1.85,
      0,
    )

    secondDot.current.position.set(
      Math.sin(time) * radius,
      (Math.cos(time) * radius * Math.atan(time)) / Math.PI / 1.85,
      0,
    )

    thirdDot.current.position.set(
      Math.sin(time) * radius,
      (Math.cos(time) * radius * Math.atan(time)) / Math.PI / 1.85,
      0,
    )
  })

  return (
    <group ref={group} position={position}>
      <mesh ref={firstDot}>
        <sphereGeometry args={[12, 16, 16]} />
        <MeshReflectorMaterial mirror={0} color={Color.highlight} />
      </mesh>
      <group rotation={[0, 0, -Math.PI / 3]}>
        <mesh ref={secondDot}>
          <sphereGeometry args={[12, 16, 16]} />
          <MeshReflectorMaterial mirror={0} color="red" />
        </mesh>
      </group>
      <group rotation={[0, 0, Math.PI / 3]}>
        <mesh ref={thirdDot}>
          <sphereGeometry args={[12, 16, 16]} />
          <MeshReflectorMaterial mirror={0} color="yellow" />
        </mesh>
      </group>

      <mesh
        geometry={nodes.Ellipse.geometry}
        material={nodes.Ellipse.material}
        castShadow
        receiveShadow
        position={[0, 0, 0]}
      >
        <MeshReflectorMaterial mirror={0} color={Color.react} />
      </mesh>
      <mesh
        geometry={nodes.Boolean_3.geometry}
        material={nodes.Boolean_3.material}
        castShadow
        receiveShadow
        position={[0, 0, 0]}
        rotation={[0, 0, -Math.PI / 3]}
      >
        <MeshReflectorMaterial mirror={0} color={Color.react} />
      </mesh>
      <mesh
        geometry={nodes.Boolean_2.geometry}
        material={nodes.Boolean_2.material}
        castShadow
        receiveShadow
        position={[0, 0, 0]}
        rotation={[0, 0, Math.PI / 3]}
      >
        <MeshReflectorMaterial mirror={0} color={Color.react} />
      </mesh>
      <mesh
        geometry={nodes.Boolean.geometry}
        material={nodes.Boolean.material}
        castShadow
        receiveShadow
        position={[0, 0, 0]}
      >
        <MeshReflectorMaterial mirror={0} color={Color.react} toneMapped={false} />
      </mesh>
    </group>
  )
}
