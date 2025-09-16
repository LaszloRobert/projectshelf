'use client'

import { useState, useEffect } from 'react'
import { X, AlertTriangle, Settings, Database, Globe } from 'lucide-react'
import { VersionClient } from '@/lib/client/version'
import type { DeploymentInfo } from '@/types/version'

interface UpdateConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (method?: string, config?: any) => Promise<void>
  updateInfo: {
    currentVersion: string
    latestVersion?: string
    releaseInfo?: {
      name: string
      notes: string
      publishedAt: string
      url: string
    } | null
  }
}

export default function UpdateConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  updateInfo
}: UpdateConfirmationModalProps) {
  const [deploymentInfo, setDeploymentInfo] = useState<DeploymentInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [customPort, setCustomPort] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchDeploymentInfo()
    }
  }, [isOpen])

  const fetchDeploymentInfo = async () => {
    setLoading(true)
    try {
      const info = await VersionClient.getDeploymentInfo()
      if (info) {
        setDeploymentInfo(info)
        setCustomPort(info.config?.port || '8081')
      }
    } catch (error) {
      console.error('Error fetching deployment info:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!deploymentInfo) return

    setConfirming(true)
    try {
      let config = deploymentInfo.config

      // If user changed port, update config
      if (customPort && customPort !== deploymentInfo.config?.port) {
        config = { ...config!, port: customPort }
      }

      await onConfirm(deploymentInfo.method, config)
      onClose()
    } catch (error) {
      console.error('Update failed:', error)
    } finally {
      setConfirming(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Confirm Update
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Update Info */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Update Available
            </h3>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Current Version:</span>
                <span className="font-mono text-gray-900 dark:text-gray-100">
                  {updateInfo.currentVersion}
                </span>
              </div>
              {updateInfo.latestVersion && (
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600 dark:text-gray-400">Latest Version:</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-medium">
                    {updateInfo.latestVersion}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Deployment Configuration */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : deploymentInfo ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Current Configuration
                </h3>
              </div>

              {/* Deployment Method */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Deployment Method:</span>
                  <span className="font-mono text-sm bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded capitalize">
                    {deploymentInfo.method}
                  </span>
                </div>
              </div>

              {/* Docker Configuration */}
              {deploymentInfo.config && (
                <div className="space-y-3">
                  {/* Port Configuration */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Port Configuration
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Port:</span>
                      <input
                        type="text"
                        value={customPort}
                        onChange={(e) => setCustomPort(e.target.value)}
                        className="font-mono text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-2 py-1 rounded w-20 text-center"
                      />
                      <span className="text-sm text-gray-500">→ 8080 (container)</span>
                    </div>
                  </div>

                  {/* Advanced Configuration */}
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {showAdvanced ? 'Hide' : 'Show'} Advanced Configuration
                  </button>

                  {showAdvanced && (
                    <div className="space-y-3">
                      {/* Volumes */}
                      {deploymentInfo.config.volumes.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Database className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Volume Mounts
                            </span>
                          </div>
                          <div className="space-y-1">
                            {deploymentInfo.config.volumes.map((volume, index) => (
                              <div key={index} className="font-mono text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded">
                                {volume}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Environment Variables */}
                      {deploymentInfo.config.envVars.filter(env =>
                        !env.startsWith('PATH=') &&
                        !env.startsWith('HOME=') &&
                        !env.startsWith('HOSTNAME=')
                      ).length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Settings className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Environment Variables
                            </span>
                          </div>
                          <div className="space-y-1">
                            {deploymentInfo.config.envVars
                              .filter(env => !env.startsWith('PATH=') && !env.startsWith('HOME=') && !env.startsWith('HOSTNAME='))
                              .map((env, index) => (
                              <div key={index} className="font-mono text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded">
                                {env.split('=')[0]}=***
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Warning */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-medium mb-1">Important Notes:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Your current configuration will be preserved during the update</li>
                      <li>The application will restart with the same settings</li>
                      <li>Database and data files will remain unchanged</li>
                      {deploymentInfo.method === 'docker' && (
                        <li>The Docker container will be recreated with the latest image</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              Unable to detect current configuration
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            disabled={confirming}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!deploymentInfo || confirming}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium disabled:cursor-not-allowed flex items-center gap-2"
          >
            {confirming ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Updating...
              </>
            ) : (
              'Confirm Update'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}