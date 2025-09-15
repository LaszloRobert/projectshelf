'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react'
import { VersionClient } from '@/lib/client/version'
import type { VersionCheckResult } from '@/types/version'

type UpdateInfo = VersionCheckResult

interface UpdateContextType {
  updateInfo: UpdateInfo | null
  loading: boolean
  updating: boolean
  updateProgress: string
  showNavbarDot: boolean
  showVersionTabDot: boolean
  showConfirmDialog: boolean
  refreshUpdates: () => Promise<void>
  showUpdateConfirmation: () => void
  executeUpdate: (method?: string, config?: any) => Promise<void>
  dismissNavbarDot: () => void
  dismissVersionTabDot: () => void
  hideConfirmDialog: () => void
}

const UpdateContext = createContext<UpdateContextType | null>(null)

export function UpdateProvider({ children }: { children: ReactNode }) {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [updateProgress, setUpdateProgress] = useState('')
  const [showNavbarDot, setShowNavbarDot] = useState(false)
  const [showVersionTabDot, setShowVersionTabDot] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const refreshUpdates = useCallback(async () => {
    setLoading(true)
    try {
      const result = await VersionClient.checkForUpdates()
      setUpdateInfo(result)

      // Update dot visibility based on localStorage
      if (result.hasUpdate && result.latestVersion) {
        const navbarDismissed = localStorage.getItem(`update-dismissed-${result.latestVersion}`)
        const versionTabDismissed = localStorage.getItem(`version-tab-dismissed-${result.latestVersion}`)

        setShowNavbarDot(!navbarDismissed)
        setShowVersionTabDot(!versionTabDismissed)
      } else {
        setShowNavbarDot(false)
        setShowVersionTabDot(false)
      }
    } catch (error) {
      console.error('Error checking for updates:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const dismissNavbarDot = useCallback(() => {
    if (updateInfo?.latestVersion) {
      localStorage.setItem(`update-dismissed-${updateInfo.latestVersion}`, 'true')
      setShowNavbarDot(false)
    }
  }, [updateInfo?.latestVersion])

  const dismissVersionTabDot = useCallback(() => {
    if (updateInfo?.latestVersion) {
      localStorage.setItem(`version-tab-dismissed-${updateInfo.latestVersion}`, 'true')
      setShowVersionTabDot(false)
    }
  }, [updateInfo?.latestVersion])

  const showUpdateConfirmation = useCallback(() => {
    setShowConfirmDialog(true)
  }, [])

  const hideConfirmDialog = useCallback(() => {
    setShowConfirmDialog(false)
  }, [])

  const executeUpdate = useCallback(async (method?: string, config?: any) => {
    if (!updateInfo?.hasUpdate) return

    setUpdating(true)
    setUpdateProgress('Initializing update...')

    try {
      const updateMethod = method || 'docker'

      setUpdateProgress(
        updateMethod === 'compose' ? 'Pulling latest images and restarting services...' :
          updateMethod === 'docker' ? 'Pulling latest Docker image...' :
            'Pulling latest code from Git...'
      )

      const result = await VersionClient.executeUpdate(updateMethod, config)

      if (result.success) {
        setUpdateProgress('Update completed! Application will restart shortly...')

        // Clear update dots since we've updated
        if (updateInfo.latestVersion) {
          localStorage.setItem(`update-dismissed-${updateInfo.latestVersion}`, 'true')
          localStorage.setItem(`version-tab-dismissed-${updateInfo.latestVersion}`, 'true')
        }

        // Refresh update info after a delay to see if update was successful
        setTimeout(() => {
          refreshUpdates()
        }, 5000)

        // Show success message for a bit then reset
        setTimeout(() => {
          setUpdating(false)
          setUpdateProgress('')
        }, 10000)
      } else {
        throw new Error(result.error || 'Update failed')
      }
    } catch (error) {
      console.error('Update failed:', error)
      setUpdateProgress(`Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setTimeout(() => {
        setUpdating(false)
        setUpdateProgress('')
      }, 5000)
    }
  }, [updateInfo, refreshUpdates])

  // Check for updates on mount
  useEffect(() => {
    refreshUpdates()
  }, [refreshUpdates])

  const contextValue = useMemo(() => ({
    updateInfo,
    loading,
    updating,
    updateProgress,
    showNavbarDot,
    showVersionTabDot,
    showConfirmDialog,
    refreshUpdates,
    showUpdateConfirmation,
    executeUpdate,
    dismissNavbarDot,
    dismissVersionTabDot,
    hideConfirmDialog
  }), [
    updateInfo,
    loading,
    updating,
    updateProgress,
    showNavbarDot,
    showVersionTabDot,
    showConfirmDialog,
    refreshUpdates,
    showUpdateConfirmation,
    executeUpdate,
    dismissNavbarDot,
    dismissVersionTabDot,
    hideConfirmDialog
  ])

  return (
    <UpdateContext.Provider value={contextValue}>
      {children}
    </UpdateContext.Provider>
  )
}

export function useUpdate() {
  const context = useContext(UpdateContext)
  if (!context) {
    throw new Error('useUpdate must be used within an UpdateProvider')
  }
  return context
}