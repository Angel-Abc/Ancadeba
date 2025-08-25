import React, { useEffect, useState } from 'react'
import { Tree } from './Tree'
import { Content } from './Content'

export const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const root = document.getElementById('root')
    root?.style.setProperty('--sidebar-width', collapsed ? '0px' : '300px')
  }, [collapsed])

  return (
    <>
      <Tree collapsed={collapsed} />
      <Content onToggleSidebar={() => setCollapsed(prev => !prev)} />
    </>
  )
}

