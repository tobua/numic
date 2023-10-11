import { Color } from '../style'
import { useBreakpoint } from '../helper/breakpoint'

function InlineCode({ children }: { children: string }) {
  const { mobile } = useBreakpoint()

  return (
    <span
      style={{
        fontFamily: 'monospace',
        fontWeight: 'bold',
        fontSize: '90%',
        background: Color.background,
        padding: mobile ? 1 : 3,
        borderRadius: 5,
      }}
    >
      {children}
    </span>
  )
}

const features = {
  patch: {
    title: 'Native Code as a Patch',
    description: (
      <span>
        This plugin will manage the native <InlineCode>/android</InlineCode> and{' '}
        <InlineCode>/ios</InlineCode> folders for you. No need to commit dozens of files. Only the
        changes made have to be committed to the repository in the form of a patch.
      </span>
    ),
    next: 'plugin',
  },
  plugin: {
    title: 'Plugins',
    description:
      'Various plugins to automatically apply common changes like icons to native folders.',
    previous: 'patch',
    next: 'update',
  },
  update: {
    title: 'Automatic Updates of Native Folders',
    description:
      'Updating native code to the most recent React Native Version is as easy as updating the dependency and reinstalling the project.',
    previous: 'plugin',
    next: 'migration',
  },
  migration: {
    title: 'Easy Migration',
    description:
      'Can be added to any existing React Native project. All changes made to native files will be moved to a single patch file.',
    previous: 'update',
  },
}

const buttonStyles = (active: boolean, mobile: boolean) => ({
  cursor: active ? 'pointer' : 'auto',
  border: 'none',
  outline: 'none',
  background: 'none',
  color: active ? Color.highlight : Color.backgroundDarker,
  fontWeight: 700,
  fontSize: mobile ? 18 : 24,
})

export function Features({
  currentFeature,
  setFeature,
}: {
  currentFeature: string
  setFeature: (value: string) => void
}) {
  const feature = features[currentFeature]
  const { mobile } = useBreakpoint()

  return (
    <div style={{ position: 'relative', backgroundColor: Color.highlight, borderRadius: 5 }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          border: `2px solid ${Color.highlight}`,
          backgroundColor: Color.highlight,
          borderRadius: 5,
          transform: 'translate(4px, 4px)',
          zIndex: -1,
        }}
      />
      <div
        style={{
          display: 'flex',
          border: '2px solid black',
          borderRadius: 5,
          padding: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          minHeight: mobile ? 100 : 160,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 5 : 10, flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: mobile ? 16 : 24, lineHeight: 1.2 }}>
            {feature.title}
          </h2>
          <p style={{ margin: 0, fontSize: mobile ? 12 : 16, lineHeight: 1.2 }}>
            {feature.description}
          </p>
        </div>
        <div
          style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}
        >
          <button
            type="button"
            disabled={!feature.previous}
            style={buttonStyles(feature.previous, mobile)}
            onClick={() => setFeature(feature.previous)}
          >
            Previous
          </button>
          <button
            type="button"
            disabled={!feature.next}
            style={buttonStyles(feature.next, mobile)}
            onClick={() => setFeature(feature.next)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
