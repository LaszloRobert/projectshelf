'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, Loader2, Download, Package, Database, RefreshCw, Rocket } from 'lucide-react'
import { VersionClient } from '@/lib/client/version'
import { UpdateProgress } from '@/lib/services/in-place-update'

interface UpdateProgressModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetVersion?: string
}

export default function UpdateProgressModal({
  open,
  onOpenChange,
  targetVersion
}: UpdateProgressModalProps) {
  const [progress, setProgress] = useState<UpdateProgress | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  // Poll for update progress
  const pollProgress = useCallback(async () => {
    try {
      const result = await VersionClient.getUpdateProgress()

      if (result.progress) {
        setProgress(result.progress)

        // Check if completed or errored
        if (result.progress.stage === 'completed') {
          setIsComplete(true)
          if (pollingInterval) {
            clearInterval(pollingInterval)
            setPollingInterval(null)
          }
        } else if (result.progress.stage === 'error') {
          setHasError(true)
          if (pollingInterval) {
            clearInterval(pollingInterval)
            setPollingInterval(null)
          }
        }
      }

      // If no update in progress and we haven't completed, something went wrong
      if (!result.updateInProgress && !isComplete && progress) {
        setHasError(true)
        if (pollingInterval) {
          clearInterval(pollingInterval)
          setPollingInterval(null)
        }
      }
    } catch (error) {
      console.error('Error polling update progress:', error)
      setHasError(true)
      if (pollingInterval) {
        clearInterval(pollingInterval)
        setPollingInterval(null)
      }
    }
  }, [pollingInterval, isComplete, progress])

  // Start polling when modal opens
  useEffect(() => {
    if (open && !pollingInterval && !isComplete) {
      const interval = setInterval(pollProgress, 1000) // Poll every second
      setPollingInterval(interval)

      // Initial poll
      pollProgress()
    }

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [open, pollingInterval, isComplete, pollProgress])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'starting':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      case 'downloading':
        return <Download className="h-5 w-5 text-blue-500" />
      case 'extracting':
        return <Package className="h-5 w-5 text-purple-500" />
      case 'backing_up':
        return <Database className="h-5 w-5 text-green-500" />
      case 'updating':
        return <RefreshCw className="h-5 w-5 text-orange-500" />
      case 'restarting':
        return <Rocket className="h-5 w-5 text-indigo-500" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
    }
  }

  const getStageDescription = (stage: string) => {
    switch (stage) {
      case 'starting':
        return 'Initializing update process...'
      case 'downloading':
        return 'Downloading the latest version from GitHub...'
      case 'extracting':
        return 'Extracting update files...'
      case 'backing_up':
        return 'Creating backup of current version...'
      case 'updating':
        return 'Applying update and running migrations...'
      case 'restarting':
        return 'Restarting application...'
      case 'completed':
        return 'Update completed successfully! The application will restart momentarily. Please refresh your browser after 30 seconds.'
      case 'error':
        return 'Update failed. The application has been restored to the previous version.'
      default:
        return 'Preparing update...'
    }
  }

  const handleClose = () => {
    // Only allow closing if completed or errored
    if (isComplete || hasError) {
      // Clean up polling
      if (pollingInterval) {
        clearInterval(pollingInterval)
        setPollingInterval(null)
      }

      // Reset state
      setProgress(null)
      setIsComplete(false)
      setHasError(false)

      onOpenChange(false)
    }
  }

  // Show restart message for completed updates
  if (isComplete && progress?.stage === 'completed') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Update Completed
            </DialogTitle>
          </DialogHeader>

          <div className="py-6 text-center">
            <div className="mb-4">
              <Rocket className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-700 mb-2">
                Successfully Updated to {targetVersion}!
              </h3>
              <p className="text-muted-foreground">
                ProjectShelf has been updated successfully and is restarting.
                Please wait 30 seconds and refresh your browser to see the updated application.
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg mb-4">
              <p className="text-sm text-green-700 dark:text-green-300">
                💡 <strong>Important:</strong> The application is restarting now. You&apos;ll need to manually refresh
                your browser in about 30 seconds to access the updated version.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleClose} className="bg-green-600 hover:bg-green-700">
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={hasError ? handleClose : undefined}>
      <DialogContent className="sm:max-w-md">{/* Note: Dialog close is handled by onOpenChange prop */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasError ? (
              <>
                <AlertCircle className="h-5 w-5 text-red-500" />
                Update Failed
              </>
            ) : (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                Updating ProjectShelf
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          {/* Progress bar */}
          {progress?.progress !== undefined && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{progress.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    hasError ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Current stage */}
          <div className="flex items-start gap-3 mb-4">
            <div className="mt-0.5">
              {progress ? getStageIcon(progress.stage) : <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
            </div>
            <div className="flex-1">
              <div className="font-medium mb-1">
                {progress?.message || 'Initializing update...'}
              </div>
              <div className="text-sm text-muted-foreground">
                {progress ? getStageDescription(progress.stage) : 'Please wait while we prepare the update...'}
              </div>
            </div>
          </div>

          {/* Error details */}
          {hasError && progress?.error && (
            <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg mb-4">
              <p className="text-sm text-red-700 dark:text-red-300 font-medium mb-2">
                Error Details:
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 font-mono">
                {progress.error}
              </p>
            </div>
          )}

          {/* Backup info */}
          {progress?.backupPath && (
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Backup created:</strong> {progress.backupPath}
              </p>
            </div>
          )}

          {/* Warning about not closing */}
          {!hasError && !isComplete && (
            <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                <strong>⚠️ Important:</strong> Do not close this dialog during the update process.
                When the update completes, the application will restart and you&apos;ll need to refresh your browser.
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {hasError && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}