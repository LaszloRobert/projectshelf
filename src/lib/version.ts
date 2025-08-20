interface VersionCheckResult {
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

export async function checkForUpdates(): Promise<VersionCheckResult> {
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

export function formatReleaseDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}