'use client'

import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => (
  <Sonner
    theme="dark"
    className="toaster group"
    style={
      {
        '--normal-bg': '#111111',
        '--normal-text': 'rgba(255,255,255,0.85)',
        '--normal-border': 'rgba(255,255,255,0.08)',
      } as React.CSSProperties
    }
    {...props}
  />
)

export { Toaster }
