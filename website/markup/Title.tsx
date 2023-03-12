import React from 'react'
import { useBreakpoint } from '../helper/breakpoint'
import { Color } from '../style'

export function Title() {
  const { mobile } = useBreakpoint()

  return (
    <h1
      style={{
        color: Color.black,
        fontSize: mobile ? 40 : 100,
        WebkitTextFillColor: Color.transparent,
        WebkitTextStrokeWidth: mobile ? 1 : 2,
        WebkitTextStrokeColor: Color.black,
        margin: 0,
      }}
    >
      numic
    </h1>
  )
}
