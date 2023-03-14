import React, { useState } from 'react'
import { useBreakpoint } from '../helper/breakpoint'
import { Color } from '../style'

function Code({ children }: { children: string }) {
  const { mobile } = useBreakpoint()

  return (
    <pre
      style={{
        borderWidth: mobile ? 1 : 2,
        borderColor: Color.highlight,
        borderStyle: 'solid',
        borderRadius: mobile ? 3 : 6,
        padding: mobile ? 3 : 6,
        backgroundColor: 'white',
        overflow: 'auto',
      }}
    >
      {children}
    </pre>
  )
}

export function GettingStarted() {
  const [open, setOpen] = useState(false)
  const { mobile } = useBreakpoint()

  return (
    <>
      <a
        style={{
          position: 'absolute',
          textDecoration: 'none',
          bottom: mobile ? 10 : 20,
          right: mobile ? 10 : 20,
          color: Color.highlight,
          fontSize: mobile ? 18 : 22,
          fontWeight: 'bold',
          lineHeight: 1,
          cursor: 'pointer',
        }}
        onClick={(event) => {
          event.preventDefault()
          setOpen(true)
        }}
      >
        {mobile ? 'Guide' : 'Getting Started'} ➜
      </a>
      {open && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: Color.background,
            padding: mobile ? 10 : 20,
          }}
        >
          <h2 style={{ color: Color.highlight }}>Getting Started</h2>
          <p>To create a fresh React Native project using numic run the following:</p>
          <Code>npm init --yes now numic ./my-app</Code>
          <p>To add numic to an existing React Native project install it like this.</p>
          <Code>npm install numic --save-dev --foreground-scripts --legacy-peer-deps</Code>
          <p>
            If you have already made changes to the native folders make sure to follow this{' '}
            <a
              style={{ textDecoration: 'none', color: Color.black, fontWeight: 'bold' }}
              href="https://github.com/tobua/numic#migration-of-an-existing-project"
            >
              migration guide
            </a>
            .
          </p>
          <button
            style={{
              position: 'absolute',
              top: mobile ? 10 : 20,
              right: mobile ? 10 : 20,
              background: Color.highlight,
              borderRadius: mobile ? 5 : 10,
              border: 'none',
              color: 'white',
              fontWeight: 'bold',
              padding: mobile ? 5 : 10,
              fontSize: mobile ? 12 : 16,
              cursor: 'pointer',
            }}
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>
      )}
    </>
  )
}
