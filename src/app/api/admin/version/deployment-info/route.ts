import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { VersionService } from '@/lib/services/version-service'

export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
  }

  try {
    const deploymentInfo = await VersionService.getDeploymentInfo()
    return NextResponse.json(deploymentInfo)
  } catch (error) {
    console.error('Error getting deployment info:', error)
    return NextResponse.json(
      {
        error: 'Failed to get deployment information',
        method: 'docker' // fallback
      },
      { status: 500 }
    )
  }
}