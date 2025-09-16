import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { InPlaceUpdateService, UpdateProgress } from '@/lib/services/in-place-update'
import { VersionService } from '@/lib/services/version-service'

// Store active update status and progress
let updateInProgress = false
let updateProgress: UpdateProgress | null = null

export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
  }

  // Return current update progress if update is in progress
  return NextResponse.json({
    updateInProgress,
    progress: updateProgress
  })
}

// POST endpoint for executing in-place updates
export async function POST(_request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
  }

  if (updateInProgress) {
    return NextResponse.json(
      { error: 'Update already in progress' },
      { status: 409 }
    )
  }

  try {
    // Get current version info first
    const versionInfo = await VersionService.checkForUpdates()

    if (!versionInfo.hasUpdate || !versionInfo.latestVersion) {
      return NextResponse.json(
        { error: 'No updates available' },
        { status: 400 }
      )
    }

    // Set update in progress
    updateInProgress = true
    updateProgress = {
      stage: 'starting',
      message: 'Initializing update process...',
      progress: 0
    }

    // Set up progress callback
    InPlaceUpdateService.setProgressCallback((progress) => {
      updateProgress = progress
    })

    // Execute update asynchronously
    const executeUpdate = async () => {
      try {
        const result = await InPlaceUpdateService.executeUpdate(versionInfo.latestVersion!)

        updateProgress = {
          stage: result.success ? 'completed' : 'error',
          message: result.message,
          progress: result.success ? 100 : 0,
          error: result.error,
          backupPath: result.backupPath
        }

        // Reset update status after completion/error
        setTimeout(() => {
          updateInProgress = false
          updateProgress = null
        }, 10000) // Keep status for 10 seconds after completion

        return result

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

        updateProgress = {
          stage: 'error',
          message: 'Update failed',
          progress: 0,
          error: errorMessage
        }

        updateInProgress = false

        throw error
      }
    }

    // Start update process
    executeUpdate().catch(error => {
      console.error('Update process failed:', error)
    })

    // Return immediate response
    return NextResponse.json({
      message: 'Update process started',
      updateInProgress: true,
      targetVersion: versionInfo.latestVersion
    })

  } catch (error) {
    updateInProgress = false
    updateProgress = null

    console.error('Update initialization error:', error)
    return NextResponse.json(
      {
        error: 'Failed to start update process',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE endpoint to cancel/reset update status (for emergency)
export async function DELETE() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
  }

  updateInProgress = false
  updateProgress = null

  return NextResponse.json({ message: 'Update status reset' })
}