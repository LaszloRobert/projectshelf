'use client'

import { ThemeProvider } from 'next-themes'
import React from 'react'
import { UpdateProvider, useUpdate } from '@/contexts/UpdateContext'
import UpdateConfirmationModal from '@/components/features/UpdateConfirmationModal'

function UpdateModalContainer() {
  const { showConfirmDialog, hideConfirmDialog, updateInfo, executeUpdate } = useUpdate()

  if (!updateInfo?.hasUpdate) return null

  return (
    <UpdateConfirmationModal
      isOpen={showConfirmDialog}
      onClose={hideConfirmDialog}
      onConfirm={executeUpdate}
      updateInfo={updateInfo}
    />
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <UpdateProvider>
        {children}
        <UpdateModalContainer />
      </UpdateProvider>
    </ThemeProvider>
  )
} 