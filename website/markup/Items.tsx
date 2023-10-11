import { Euler } from '@react-three/fiber'
import { Float, MeshReflectorMaterial, RoundedBox } from '@react-three/drei'
import { Vector3 } from 'three'
import { Nodes } from '../types'
import { Color, Material } from '../style'
import { Apple } from './item/Apple'
import { React } from './item/React'

const appIcons = [
  { color: '#00FFFF', position: [-30, 55, 0] },
  { color: '#F0FFFF', position: [0, 55, 0] },
  { color: '#7FFFD4', position: [30, 55, 0] },
  { color: '#8A2BE2', position: [-30, 25, 0] },
  { color: '#7FFF00', position: [0, 25, 0] },
  { color: '#FF7F50', position: [30, 25, 0] },
  { color: '#00008B', position: [-30, -5, 0] },
  { color: '#9932CC', position: [0, -5, 0] },
  { color: '#8FBC8F', position: [30, -5, 0] },
  { color: '#00CED1', position: [-30, -35, 0] },
  { color: '#B22222', position: [0, -35, 0] },
  { color: '#CD5C5C', position: [-30, -65, 0] },
  { color: '#ADD8E6', position: [0, -65, 0] },
  { color: '#20B2AA', position: [30, -65, 0] },
]

function iPhone({ nodes, position = new Vector3(0, 0, 0) }: { nodes: Nodes; position?: Vector3 }) {
  return (
    <group>
      <mesh
        geometry={nodes.iPhone.geometry}
        material={nodes.iPhone.material}
        castShadow
        receiveShadow
        position={position}
      />
      {appIcons.map((icon) => (
        <RoundedBox
          key={icon.color}
          position={[
            position.x + icon.position[0],
            position.y + icon.position[1],
            position.z + icon.position[2],
          ]}
          args={[20, 20, 10]}
          radius={4}
        >
          <meshLambertMaterial attach="material" color={icon.color} />
        </RoundedBox>
      ))}
    </group>
  )
}

function Android({
  nodes,
  position = new Vector3(0, 0, 0),
  rotation = [0, 0, 0],
  float = true,
}: {
  nodes: Nodes
  position?: Vector3
  rotation?: Euler
  float?: boolean
}) {
  return (
    <Float speed={float ? undefined : 0} rotationIntensity={0.2}>
      <group position={position} rotation={rotation}>
        <mesh
          name="Merged Geometry"
          geometry={nodes.Merged_Geometry.geometry}
          material={Material.highlight}
          castShadow
          receiveShadow
          position={[0, 43.25, 0]}
        >
          <MeshReflectorMaterial mirror={0} color={Color.highlight} />
        </mesh>
      </group>
    </Float>
  )
}

export const SceneItems = { iPhone, React, Android, Apple }
