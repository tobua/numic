import React, { useEffect, useRef, useState } from 'react'
import { Vector3, useFrame } from '@react-three/fiber'
import { Box, MeshReflectorMaterial } from '@react-three/drei'
import { Physics, RigidBody } from '@react-three/rapier'
import { useSnapshot } from 'valtio'
import { Nodes } from '../../types'
import { Performance } from '../Quality'

const circlePoints = (
  count: number,
  radius: number,
  center: { x: number; y: number } = { x: 0, y: 0 },
) => {
  const slice = (2 * Math.PI) / count
  const result: { x: number; y: number }[] = []

  for (let index = 0; index < count; index++) {
    const angle = slice * index
    result.push({ x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) })
  }

  return result
}

function Floor() {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <Box position={[0, -500, -200]} scale={[5000, 1, 9000]} rotation={[0, 0, 0]}>
        <meshStandardMaterial transparent opacity={0} />
      </Box>
    </RigidBody>
  )
}

function StaticRings({ count = 10 }) {
  const points = circlePoints(count, 100)

  return (
    <group name="Rings" position={[60, -50, 0]}>
      {points.map((point, index) => (
        <mesh key={index} position={[point.x, 0, point.y]} castShadow>
          <sphereGeometry args={[10, 16, 16]} />
          <MeshReflectorMaterial mirror={0} color="white" />
        </mesh>
      ))}
    </group>
  )
}

function Rings({ count = 10, rotate = true, active = false }) {
  const group = useRef<any>(null)
  const points = circlePoints(count, 100)
  const [released, setReleased] = useState(active)

  // No longer rotate ring after parts released for fall.
  useEffect(() => {
    if (active && !released) {
      setReleased(true)
    }
  }, [active])

  useFrame((_state, delta) => rotate && !released && (group.current.rotation.y += delta / 4))

  return (
    <Physics gravity={[0, -999, 0]} colliders="hull" paused={!released}>
      <group ref={group} name="Rings" position={[60, -50, 0]}>
        {points.map((point, index) => (
          <RigidBody key={index}>
            <mesh position={[point.x, 0, point.y]} castShadow>
              <sphereGeometry args={[10, 16, 16]} />
              <MeshReflectorMaterial mirror={0} color="white" />
            </mesh>
          </RigidBody>
        ))}
      </group>
      <Floor />
    </Physics>
  )
}

function Icon({ nodes }: { nodes: Nodes }) {
  return (
    <group name="Icon">
      <mesh
        geometry={nodes.Shape_0.geometry}
        material={nodes.Shape_0.material}
        castShadow
        receiveShadow
        position={[0, 0, 0]}
        scale={0.14}
      />
      <mesh
        geometry={nodes.Shape_0_1.geometry}
        material={nodes.Shape_0_1.material}
        castShadow
        receiveShadow
        position={[50, 40, 0]}
        scale={0.14}
      />
    </group>
  )
}

export function Apple({
  nodes,
  position = [0, 0, 0],
  active = false,
  rings = true,
}: {
  nodes: Nodes
  position?: Vector3
  active?: boolean
  rings?: boolean
}) {
  const { physics } = useSnapshot(Performance)

  return (
    <group name="Apple" position={position}>
      <Icon nodes={nodes} />
      {rings &&
        (physics ? (
          <Rings active={active && physics} rotate={!active && physics} />
        ) : (
          <StaticRings />
        ))}
    </group>
  )
}
