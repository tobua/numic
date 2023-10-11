import { DetailedHTMLProps, HTMLAttributes } from 'react'
import { proxy, useSnapshot, subscribe } from 'valtio'
import { useBreakpoint } from '../helper/breakpoint'

export const Performance = proxy({ fps: 0, physics: true })

subscribe(Performance, () => {
  if (Performance.fps > 0 && Performance.fps < 25) {
    Performance.physics = false
  }
})

function Button({
  children,
  active,
  ...props
}: { active: boolean } & DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>) {
  const { mobile } = useBreakpoint()

  return (
    <span
      style={{
        fontWeight: active ? 'bold' : 'normal',
        cursor: 'pointer',
        fontSize: mobile ? 12 : 16,
        lineHeight: 1.2,
      }}
      {...props}
    >
      {children}
    </span>
  )
}

export function Quality({ dpr, onDpr }) {
  const { mobile } = useBreakpoint()
  const { fps, physics } = useSnapshot(Performance)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: mobile ? 5 : 10,
      }}
    >
      <span style={{ fontSize: mobile ? 10 : 12, lineHeight: 1.2 }}>
        Quality - {fps} FPS -{' '}
        <button
          type="button"
          style={{
            fontWeight: 'bold',
            cursor: 'pointer',
            background: 'none',
            outline: 'none',
            border: 'none',
          }}
          onClick={() => {
            Performance.physics = !physics
          }}
        >
          {physics ? 'Disable' : 'Enable'} Physics
        </button>
      </span>
      <div style={{ display: 'flex', gap: mobile ? 5 : 10 }}>
        <Button active={dpr === 0.5} onClick={() => onDpr(0.5)}>
          low
        </Button>
        <Button active={dpr === 1} onClick={() => onDpr(1)}>
          medium
        </Button>
        <Button active={dpr === 1.5} onClick={() => onDpr(1.5)}>
          high
        </Button>
      </div>
    </div>
  )
}
