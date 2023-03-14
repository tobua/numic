import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Title } from './markup/Title'
import { Description } from './markup/Description'
import { GitHubButton } from './markup/GitHubButton'
import { Scene } from './markup/Scene'
import { Features } from './markup/Features'
import { Quality } from './markup/Quality'
import { useBreakpoint } from './helper/breakpoint'
import { GettingStarted } from './markup/GettingStarted'

function App({ initialFeature = 'patch' }) {
  const [currentFeature, setCurrentFeature] = useState(initialFeature)
  const [previousFeature, setPreviousFeature] = useState(initialFeature)
  const [dpr, setDpr] = useState(1)
  const { mobile } = useBreakpoint()

  return (
    <>
      <Scene feature={currentFeature} previousFeature={previousFeature} quality={dpr} />
      <div
        style={{
          gridColumn: '2 / 2',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: mobile ? 0 : 20,
          padding: mobile ? 10 : 20,
        }}
      >
        <Title />
        <GitHubButton rotate />
      </div>
      <div style={{ gridColumn: '2 / 2', padding: mobile ? 10 : 20 }}>
        <Description />
      </div>
      <div
        style={{ gridColumn: '2 / 2', padding: mobile ? 10 : 20, width: mobile ? 'auto' : '50%' }}
      >
        <Features
          currentFeature={currentFeature}
          setFeature={(nextFeature: string) => {
            setPreviousFeature(currentFeature)
            setCurrentFeature(nextFeature)
          }}
        />
      </div>
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          paddingBottom: 10,
        }}
      >
        <Quality dpr={dpr} onDpr={setDpr} />
      </div>
      <GettingStarted />
    </>
  )
}

createRoot(document.body as HTMLElement).render(<App />)
