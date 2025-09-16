'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Download, X, RefreshCw } from 'lucide-react'
import { VersionClient } from '@/lib/client/version'
import { useUpdate } from '@/contexts/UpdateContext'

interface UpdateNotificationProps {
  className?: string
}

export default function UpdateNotification({ className }: UpdateNotificationProps) {
  const [dismissed, setDismissed] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const { updateInfo, loading, updating, updateProgress, refreshUpdates, showUpdateConfirmation } = useUpdate()

  // Don't show anything if dismissed
  if (dismissed) {
    return null
  }

  const { currentVersion, latestVersion, releaseInfo } = updateInfo || {}
  const hasUpdate = updateInfo?.hasUpdate && !updateInfo.error
  const lastChecked = new Date().toLocaleString()

  return (
    <Card className={`${hasUpdate ? 'border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800' : 'border-gray-200 bg-gray-50 dark:bg-gray-900/20 dark:border-gray-800'} ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {hasUpdate ? (
              <Download className="h-5 w-5 text-blue-600" />
            ) : (
              <Download className="h-5 w-5 text-gray-600" />
            )}
            <CardTitle className={`text-lg ${hasUpdate ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}>
              {hasUpdate ? 'Update Available' : 'System Information'}
            </CardTitle>
            {hasUpdate && latestVersion && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                v{latestVersion}
              </Badge>
            )}
            {!hasUpdate && currentVersion && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                v{currentVersion}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshUpdates}
              disabled={loading}
              className="h-8 w-8 p-0"
              title="Check for updates"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
              title="Hide this section"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription className={hasUpdate ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}>
          {updating ? (
            updateProgress || 'Updating...'
          ) : hasUpdate ? (
            `A new version of Project Shelf is available. Current version: v${currentVersion}`
          ) : loading ? (
            'Checking for updates...'
          ) : updateInfo?.error ? (
            `Failed to check for updates. Current version: v${currentVersion || '0.1.0'}`
          ) : (
            `You&apos;re running the latest version: v${currentVersion || '0.1.0'}`
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {hasUpdate && releaseInfo ? (
              <span>Released {VersionClient.formatReleaseDate(releaseInfo.publishedAt)}</span>
            ) : (
              <span>Last checked: {lastChecked}</span>
            )}
          </div>
          <div className="flex space-x-2">
            {hasUpdate && releaseInfo ? (
              <>
                <Dialog open={showDetails} onOpenChange={setShowDetails}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      What&apos;s New
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <span>{releaseInfo.name}</span>
                        <Badge variant="secondary">v{latestVersion}</Badge>
                      </DialogTitle>
                      <DialogDescription>
                        Released on {VersionClient.formatReleaseDate(releaseInfo.publishedAt)}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Release Notes:</h4>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        {releaseInfo.notes ? (
                          <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-md overflow-x-auto">
                            {releaseInfo.notes}
                          </pre>
                        ) : (
                          <p className="text-muted-foreground">No release notes available.</p>
                        )}
                      </div>
                      <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
                        <h5 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">How to Update:</h5>
                        <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
                          <p><strong>Docker users:</strong></p>
                          <code className="block bg-yellow-100 dark:bg-yellow-900/40 p-2 rounded text-xs">
                            docker pull robertls/projectshelf:latest<br/>
                            docker stop projectshelf<br/>
                            docker rm projectshelf<br/>
                            docker run -d --name projectshelf --restart unless-stopped -p 8081:8080 -v data:/app/data robertls/projectshelf:latest
                          </code>
                          <p><strong>Docker Compose users:</strong></p>
                          <code className="block bg-yellow-100 dark:bg-yellow-900/40 p-2 rounded text-xs">
                            git pull<br/>
                            docker compose build --no-cache<br/>
                            docker compose up -d
                          </code>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  size="sm"
                  onClick={showUpdateConfirmation}
                  disabled={updating}
                  className="flex items-center space-x-1"
                >
                  <span>{updating ? 'Updating...' : 'Update Now'}</span>
                  {updating ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Download className="h-3 w-3" />
                  )}
                </Button>
              </>
            ) : !loading && (
              <Button
                variant="outline"
                size="sm"
                onClick={refreshUpdates}
                disabled={loading}
              >
                Check for Updates
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}