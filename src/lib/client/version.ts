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
   * Execute update with optional configuration
   */
  static async executeUpdate(method?: string, config?: any): Promise<UpdateResult> {
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