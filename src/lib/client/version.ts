import type { VersionCheckResult, DeploymentInfo, UpdateResult } from '@/types/version'

/**
 * Client-side version management utilities
 */
export class VersionClient {
  /**
   * Check for updates via API
   */
  static async checkForUpdates(): Promise<VersionCheckResult> {
    try {
      const response = await fetch('/api/admin/version')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        return {
          currentVersion: data.currentVersion || '0.1.0',
          hasUpdate: false,
          error: data.error
        }
      }

      return data
    } catch (error) {
      console.error('Error checking for updates:', error)
      return {
        currentVersion: '0.1.0',
        hasUpdate: false,
        error: 'Failed to check for updates'
      }
    }
  }

  /**
   * Get deployment configuration information
   */
  static async getDeploymentInfo(): Promise<DeploymentInfo | null> {
    try {
      const response = await fetch('/api/admin/version/deployment-info')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting deployment info:', error)
      return null
    }
  }

  /**
   * Execute in-place update (new simplified method)
   */
  static async executeInPlaceUpdate(): Promise<UpdateResult> {
    try {
      const response = await fetch('/api/admin/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          message: result.error || 'Update failed',
          error: result.details || result.error
        }
      }

      return {
        success: true,
        message: result.message,
        targetVersion: result.targetVersion
      }
    } catch (error) {
      console.error('Update execution failed:', error)
      return {
        success: false,
        message: 'Update failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get real-time update progress
   */
  static async getUpdateProgress(): Promise<{
    updateInProgress: boolean
    progress?: any
  }> {
    try {
      const response = await fetch('/api/admin/update')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting update progress:', error)
      return {
        updateInProgress: false
      }
    }
  }

  /**
   * Execute update with optional configuration (legacy method)
   */
  static async executeUpdate(method?: string, config?: any): Promise<UpdateResult> {
    // For new in-place updates, use the simplified method
    if (!method || method === 'in-place') {
      return this.executeInPlaceUpdate()
    }

    // Legacy method for backward compatibility
    try {
      const response = await fetch('/api/admin/version', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method,
          config
        })
      })

      return await response.json()
    } catch (error) {
      console.error('Update execution failed:', error)
      return {
        success: false,
        message: 'Update failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Format release date for display
   */
  static formatReleaseDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}

// Legacy exports for backward compatibility
export const checkForUpdates = VersionClient.checkForUpdates
export const formatReleaseDate = VersionClient.formatReleaseDate