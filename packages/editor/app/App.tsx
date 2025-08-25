import React, { useEffect, useState } from 'react'
import { Tree } from './Tree'
import { Content } from './Content'

export const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const onToggleSidebar = () => setCollapsed(prev => !prev)

  useEffect(() => {
    const root = document.getElementById('root')
    root?.classList.toggle('collapsed', collapsed)
  }, [collapsed])

  return (
    <>
      <Tree collapsed={collapsed} onToggleSidebar={onToggleSidebar} />
      <Content />
    </>
  )
}

