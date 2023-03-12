import React, { useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Text, RoundedBox } from '@react-three/drei'
import { Color } from '../style'

export function Button({ title = 'Press Me!', href }) {
  const mesh = useRef<any>()
  const [hovered, setHover] = useState(false)
  const [active, setActive] = useState(false)

  return (
    <button
      style={{
        border: 'none',
        outline: 'none',
        background: 'none',
        cursor: 'pointer',
        padding: 0,
        width: 200,
        height: 70,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => {
        setActive(!active)
        if (href && process.env.NODE_ENV === 'production') {
          window.location.href = href
        }
      }}
    >
      <Canvas>
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <mesh position={[0, 0, 0.5]} ref={mesh} scale={active ? 1.5 : 1}>
          <RoundedBox args={[10, 3, 5]} radius={1}>
            <meshStandardMaterial color={hovered ? Color.backgroundDarker : Color.highlight} />
          </RoundedBox>
        </mesh>
        <Text
          position={[0, 0, active ? 5 : 3.5]}
          color="white"
          fontSize={hovered ? 3.3 : 2}
          anchorX="center"
          anchorY="middle"
        >
          {title}
        </Text>
      </Canvas>
    </button>
  )
}
