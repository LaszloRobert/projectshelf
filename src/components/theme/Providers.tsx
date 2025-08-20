'use client'

import { ThemeProvider } from 'next-themes'
import React from 'react'
import { UpdateProvider } from '@/contexts/UpdateContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <UpdateProvider>
        {children}
      </UpdateProvider>
    </ThemeProvider>
  )
} 