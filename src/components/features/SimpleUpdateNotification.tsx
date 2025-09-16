'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react'
import { VersionClient } from '@/lib/client/version'
import { useUpdate } from '@/contexts/UpdateContext'
import UpdateProgressModal from './UpdateProgressModal'

interface SimpleUpdateNotificationProps {
  className?: string
}

export default function SimpleUpdateNotification({ className }: SimpleUpdateNotificationProps) {
  const [showProgress, setShowProgress] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [targetVersion, setTargetVersion] = useState<string>()

  const { updateInfo, loading, refreshUpdates } = useUpdate()

  const { currentVersion, latestVersion, releaseInfo } = updateInfo || {}
  const hasUpdate = updateInfo?.hasUpdate && !updateInfo.error

  const handleUpdate = async () => {
    if (isUpdating || !latestVersion) return

    try {
      setIsUpdating(true)
      setUpdateError(null)
      setTargetVersion(latestVersion)

      // Execute the simplified in-place update
      const result = await VersionClient.executeInPlaceUpdate()

      if (result.success) {
        // Show progress modal
        setShowProgress(true)
      } else {
        setUpdateError(result.error || 'Update failed')
      }
    } catch (error) {
      console.error('Update error:', error)
      setUpdateError(error instanceof Error ? error.message : 'Unknown error occurred')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleProgressClose = () => {
    setShowProgress(false)
    setTargetVersion(undefined)
    // Refresh update info after modal closes
    refreshUpdates()
  }

  if (loading) {
    return (
      <Card className="border-gray-200 bg-gray-50 dark:bg-gray-900/20 dark:border-gray-800">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin text-gray-600" />
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
              Checking for updates...
            </CardTitle>
          </div>
        </CardHeader>
      </Card>
    )
  }

  if (updateInfo?.error) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg text-amber-900 dark:text-amber-100">
              Update Check Failed
            </CardTitle>
          </div>
          <CardDescription className="text-amber-700 dark:text-amber-300">
            {updateInfo.error}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Button onClick={refreshUpdates} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={`${hasUpdate ? 'border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800' : 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800'} ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {hasUpdate ? (
                <Download className="h-5 w-5 text-blue-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              <CardTitle className={`text-lg ${hasUpdate ? 'text-blue-900 dark:text-blue-100' : 'text-green-900 dark:text-green-100'}`}>
                {hasUpdate ? 'Update Available' : 'Up to Date'}
              </CardTitle>
              {latestVersion && (
                <Badge variant="secondary" className={hasUpdate ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}>
                  v{latestVersion}
                </Badge>
              )}
            </div>

            <Button onClick={refreshUpdates} variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <CardDescription className={hasUpdate ? 'text-blue-700 dark:text-blue-300' : 'text-green-700 dark:text-green-300'}>
            {hasUpdate
              ? `A new version (v${latestVersion}) is available for ProjectShelf.`
              : `ProjectShelf is running the latest version (v${currentVersion}).`
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          {hasUpdate && (
            <div className="space-y-4">
              {/* Release notes preview */}
              {releaseInfo?.notes && (
                <div className="bg-white dark:bg-gray-800/50 p-3 rounded-lg border">
                  <p className="text-sm font-medium mb-2">What&apos;s New:</p>
                  <div className="text-sm text-muted-foreground max-h-20 overflow-y-auto">
                    {releaseInfo.notes.length > 200
                      ? `${releaseInfo.notes.substring(0, 200)}...`
                      : releaseInfo.notes
                    }
                  </div>
                </div>
              )}

              {/* Update error */}
              {updateError && (
                <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    <strong>Update failed:</strong> {updateError}
                  </p>
                </div>
              )}

              {/* Update button */}
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Current: v{currentVersion}
                </div>
                <Button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Starting Update...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Update Now
                    </>
                  )}
                </Button>
              </div>

            </div>
          )}

          {!hasUpdate && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Last checked: {new Date().toLocaleTimeString()}</span>
              {releaseInfo?.publishedAt && (
                <span>Released: {VersionClient.formatReleaseDate(releaseInfo.publishedAt)}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Modal */}
      <UpdateProgressModal
        open={showProgress}
        onOpenChange={handleProgressClose}
        targetVersion={targetVersion}
      />
    </>
  )
}