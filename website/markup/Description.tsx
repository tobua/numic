import { useBreakpoint } from '../helper/breakpoint'

export function Description() {
  const { mobile } = useBreakpoint()

  return (
    <p style={{ margin: 0, fontSize: mobile ? 14 : 18, lineHeight: 1.2 }}>
      An Open Source plugin to manage native folders for any React Native project.
    </p>
  )
}
