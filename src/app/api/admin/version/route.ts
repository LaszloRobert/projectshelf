import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { VersionService } from '@/lib/services/version-service'

export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
  }

  try {
    const updateInfo = await VersionService.checkForUpdates()
    return NextResponse.json(updateInfo)
  } catch (error) {
    console.error('Error checking for updates:', error)
    return NextResponse.json(
      {
        error: 'Failed to check for updates',
        currentVersion: '-',
        hasUpdate: false
      },
      { status: 500 }
    )
  }
}

// POST endpoint for updating the application
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
  }

  try {
    const { method, config } = await request.json()

    const result = await VersionService.executeUpdate(method, config)

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 500 })
    }
  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json(
      { error: 'Update failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

