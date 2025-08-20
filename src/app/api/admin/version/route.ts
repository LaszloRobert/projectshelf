import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware'

interface GitHubRelease {
  tag_name: string
  name: string
  published_at: string
  html_url: string
  body: string
  draft: boolean
  prerelease: boolean
}

export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
  }

  try {
    // Get current version from package.json
    let currentVersion = '0.1.0'
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs')
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path')
      const packageJsonPath = path.join(process.cwd(), 'package.json')
      const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8')
      const packageJson = JSON.parse(packageJsonContent)
      currentVersion = packageJson.version
    } catch (err) {
      console.warn('Could not read package.json, using default version:', err)
    }
    console.log('Current version:', currentVersion)
    // Fetch latest release from GitHub
    const response = await fetch(
      'https://api.github.com/repos/LaszloRobert/projectshelf/releases/latest',
      {
        headers: {
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'ProjectShelf-UpdateChecker'
        },
        // Cache for 5 minutes to avoid hitting rate limits
        next: { revalidate: 300 }
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({
          error: 'No releases found',
          currentVersion,
          hasUpdate: false
        })
      }

      throw new Error(`GitHub API error: ${response.status}`)
    }

    const release: GitHubRelease = await response.json()

    // Skip draft and prerelease versions
    if (release.draft || release.prerelease) {
      return NextResponse.json({
        currentVersion,
        hasUpdate: false,
        message: 'Latest release is draft or prerelease'
      })
    }

    // Compare versions using the name field which contains the actual version number
    const latestVersion = release.name
    const hasUpdate = compareVersions(currentVersion, latestVersion) < 0

    return NextResponse.json({
      currentVersion,
      latestVersion,
      hasUpdate,
      releaseInfo: hasUpdate ? {
        name: release.name,
        tag: release.tag_name,
        publishedAt: release.published_at,
        url: release.html_url,
        notes: release.body
      } : null
    })

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

// Simple semantic version comparison
function compareVersions(version1: string, version2: string): number {
  const v1parts = version1.split('.').map(Number)
  const v2parts = version2.split('.').map(Number)

  const maxLength = Math.max(v1parts.length, v2parts.length)

  for (let i = 0; i < maxLength; i++) {
    const v1part = v1parts[i] || 0
    const v2part = v2parts[i] || 0

    if (v1part < v2part) return -1
    if (v1part > v2part) return 1
  }

  return 0
}

// POST endpoint for updating the application
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
  }

  try {
    const { method } = await request.json()
    
    // Check if we're running in Docker
    const isDocker = process.env.DOCKER_ENV === 'true' || process.env.NODE_ENV === 'production'
    
    if (method === 'docker' || isDocker) {
      return await handleDockerUpdate()
    } else {
      return await handleGitUpdate()
    }
  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json(
      { error: 'Update failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function handleDockerUpdate(): Promise<NextResponse> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { spawn } = require('child_process')
  
  return new Promise((resolve) => {
    const updateScript = `
      echo "Pulling latest ProjectShelf image..."
      docker pull robertls/projectshelf:latest
      echo "Stopping current container..."
      docker stop projectshelf || true
      docker rm projectshelf || true
      echo "Starting updated container..."
      docker run -d --name projectshelf --restart unless-stopped -p 8081:8080 -v data:/app/data robertls/projectshelf:latest
      echo "Update completed!"
    `
    
    const childProcess = spawn('sh', ['-c', updateScript], {
      stdio: 'pipe'
    })
    
    let output = ''
    let error = ''
    
    childProcess.stdout.on('data', (data: Buffer) => {
      output += data.toString()
    })
    
    childProcess.stderr.on('data', (data: Buffer) => {
      error += data.toString()
    })
    
    childProcess.on('close', (code: number) => {
      if (code === 0) {
        resolve(NextResponse.json({
          success: true,
          message: 'Docker update completed successfully',
          output: output
        }))
      } else {
        resolve(NextResponse.json({
          error: 'Docker update failed',
          output: output,
          stderr: error
        }, { status: 500 }))
      }
    })
    
    // If process takes too long, return success anyway (container might be restarting)
    setTimeout(() => {
      resolve(NextResponse.json({
        success: true,
        message: 'Update initiated - container restarting',
        note: 'The update process is running in the background'
      }))
    }, 30000) // 30 seconds timeout
  })
}

async function handleGitUpdate(): Promise<NextResponse> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { spawn } = require('child_process')
  
  return new Promise((resolve) => {
    const updateScript = `
      echo "Pulling latest changes from git..."
      git pull origin main || git pull origin master
      echo "Installing dependencies..."
      npm install
      echo "Building application..."
      npm run build
      echo "Restarting application..."
      pm2 restart projectshelf || npm run start &
      echo "Git update completed!"
    `
    
    const childProcess = spawn('sh', ['-c', updateScript], {
      cwd: process.cwd(),
      stdio: 'pipe'
    })
    
    let output = ''
    let error = ''
    
    childProcess.stdout.on('data', (data: Buffer) => {
      output += data.toString()
    })
    
    childProcess.stderr.on('data', (data: Buffer) => {
      error += data.toString()
    })
    
    childProcess.on('close', (code: number) => {
      if (code === 0) {
        resolve(NextResponse.json({
          success: true,
          message: 'Git update completed successfully',
          output: output
        }))
      } else {
        resolve(NextResponse.json({
          error: 'Git update failed',
          output: output,
          stderr: error
        }, { status: 500 }))
      }
    })
    
    // Timeout for git updates too
    setTimeout(() => {
      resolve(NextResponse.json({
        success: true,
        message: 'Update initiated - application restarting',
        note: 'The update process is running in the background'
      }))
    }, 60000) // 60 seconds timeout for git updates
  })
}