'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { checkForUpdates } from '@/lib/version'

interface UpdateInfo {
  currentVersion: string
  latestVersion?: string
  hasUpdate: boolean
  releaseInfo?: {
    name: string
    tag: string
    publishedAt: string
    url: string
    notes: string
  } | null
  error?: string
}

interface UpdateContextType {
  updateInfo: UpdateInfo | null
  loading: boolean
  updating: boolean
  updateProgress: string
  showNavbarDot: boolean
  showVersionTabDot: boolean
  refreshUpdates: () => Promise<void>
  startUpdate: () => Promise<void>
  dismissNavbarDot: () => void
  dismissVersionTabDot: () => void
}

const UpdateContext = createContext<UpdateContextType | null>(null)

export function UpdateProvider({ children }: { children: ReactNode }) {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [updateProgress, setUpdateProgress] = useState('')
  const [showNavbarDot, setShowNavbarDot] = useState(false)
  const [showVersionTabDot, setShowVersionTabDot] = useState(false)

  const refreshUpdates = async () => {
    setLoading(true)
    try {
      const result = await checkForUpdates()
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
  }

  const dismissNavbarDot = () => {
    if (updateInfo?.latestVersion) {
      localStorage.setItem(`update-dismissed-${updateInfo.latestVersion}`, 'true')
      setShowNavbarDot(false)
    }
  }

  const dismissVersionTabDot = () => {
    if (updateInfo?.latestVersion) {
      localStorage.setItem(`version-tab-dismissed-${updateInfo.latestVersion}`, 'true')
      setShowVersionTabDot(false)
    }
  }

  const startUpdate = async () => {
    if (!updateInfo?.hasUpdate) return
    
    setUpdating(true)
    setUpdateProgress('Initializing update...')
    
    try {
      // Determine update method based on environment
      // In browser context, we can't access process.env directly, so we'll default to docker for production-like behavior
      const isDocker = typeof window !== 'undefined' ? true : process.env.NODE_ENV === 'production'
      
      setUpdateProgress(isDocker ? 'Pulling latest Docker image...' : 'Pulling latest code from Git...')
      
      const response = await fetch('/api/admin/version', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: isDocker ? 'docker' : 'git'
        })
      })
      
      const result = await response.json()
      
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
  }

  // Check for updates on mount
  useEffect(() => {
    refreshUpdates()
  }, [])

  return (
    <UpdateContext.Provider value={{
      updateInfo,
      loading,
      updating,
      updateProgress,
      showNavbarDot,
      showVersionTabDot,
      refreshUpdates,
      startUpdate,
      dismissNavbarDot,
      dismissVersionTabDot
    }}>
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