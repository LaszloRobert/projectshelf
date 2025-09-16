/**
 * Version Service - Server-side business logic for version management
 * Used by admin API routes for update checking and management
 */

import type {
  GitHubRelease,
  VersionCheckResult,
  ContainerConfig,
  DeploymentInfo,
  UpdateResult
} from '@/types/version'

export class VersionService {
  /**
   * Get current application version from package.json
   */
  static getCurrentVersion(): string {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs')
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path')
      const packageJsonPath = path.join(process.cwd(), 'package.json')
      const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8')
      const packageJson = JSON.parse(packageJsonContent)
      return packageJson.version
    } catch (err) {
      console.warn('Could not read package.json, using default version:', err)
      return '0.1.0'
    }
  }

  /**
   * Compare two semantic versions
   */
  static compareVersions(version1: string, version2: string): number {
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

  /**
   * Check for updates from GitHub releases
   */
  static async checkForUpdates(): Promise<VersionCheckResult> {
    const currentVersion = this.getCurrentVersion()

    try {
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
          return {
            currentVersion,
            hasUpdate: false,
            error: 'No releases found'
          }
        }
        throw new Error(`GitHub API error: ${response.status}`)
      }

      const release: GitHubRelease = await response.json()

      // Skip draft and prerelease versions
      if (release.draft || release.prerelease) {
        return {
          currentVersion,
          hasUpdate: false,
          message: 'Latest release is draft or prerelease'
        }
      }

      // Compare versions using the name field which contains the actual version number
      const latestVersion = release.name
      const hasUpdate = this.compareVersions(currentVersion, latestVersion) < 0

      return {
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
      }
    } catch (error) {
      console.error('Error checking for updates:', error)
      return {
        error: 'Failed to check for updates',
        currentVersion,
        hasUpdate: false
      }
    }
  }

  /**
   * Get current Docker container configuration
   */
  static async getCurrentContainerConfig(): Promise<ContainerConfig> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { spawn } = require('child_process')

    return new Promise((resolve) => {
      const inspectScript = 'docker inspect projectshelf --format "{{json .}}"'

      const childProcess = spawn('sh', ['-c', inspectScript], {
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
        if (code === 0 && output.trim()) {
          try {
            const config = JSON.parse(output)
            const hostConfig = config.HostConfig
            const networkSettings = config.NetworkSettings

            // Extract port mapping
            let port = '8081'
            if (networkSettings?.Ports?.['8080/tcp']?.[0]) {
              port = networkSettings.Ports['8080/tcp'][0].HostPort
            }

            // Extract volumes
            const volumes = []
            if (hostConfig?.Binds) {
              volumes.push(...hostConfig.Binds)
            }
            if (hostConfig?.Mounts) {
              hostConfig.Mounts.forEach((mount: any) => {
                if (mount.Type === 'volume') {
                  volumes.push(`${mount.Name}:${mount.Destination}`)
                }
              })
            }

            // Extract environment variables
            const envVars = config.Config?.Env || []

            resolve({
              port,
              volumes,
              envVars,
              name: config.Name?.replace('/', '') || 'projectshelf'
            })
          } catch (parseError) {
            resolve({
              port: '8081',
              volumes: ['data:/app/data'],
              envVars: [],
              name: 'projectshelf'
            })
          }
        } else {
          // Default configuration if inspection fails
          resolve({
            port: '8081',
            volumes: ['data:/app/data'],
            envVars: [],
            name: 'projectshelf'
          })
        }
      })
    })
  }

  /**
   * Execute Docker update with current configuration preservation
   */
  static async executeDockerUpdate(config?: ContainerConfig): Promise<UpdateResult> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { spawn } = require('child_process')

    // Get current configuration if not provided
    const containerConfig = config || await this.getCurrentContainerConfig()

    // Build volume string
    const volumeArgs = containerConfig.volumes.map(vol => `-v ${vol}`).join(' ')

    // Build environment variable string (filter out system vars)
    const envArgs = containerConfig.envVars
      .filter(env => !env.startsWith('PATH=') && !env.startsWith('HOME=') && !env.startsWith('HOSTNAME='))
      .map(env => `-e "${env}"`)
      .join(' ')

    return new Promise((resolve) => {
      const updateScript = `
        echo "Pulling latest ProjectShelf image..."
        docker pull robertls/projectshelf:latest
        echo "Stopping current container..."
        docker stop ${containerConfig.name} || true
        docker rm ${containerConfig.name} || true
        echo "Starting updated container with preserved configuration..."
        docker run -d --name ${containerConfig.name} --restart unless-stopped -p ${containerConfig.port}:8080 ${volumeArgs} ${envArgs} robertls/projectshelf:latest
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
          resolve({
            success: true,
            message: 'Docker update completed successfully',
            output: output
          })
        } else {
          resolve({
            success: false,
            message: 'Docker update failed',
            output: output,
            error: error
          })
        }
      })

      // If process takes too long, return success anyway (container might be restarting)
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Update initiated - container restarting',
          output: 'The update process is running in the background'
        })
      }, 30000) // 30 seconds timeout
    })
  }

  /**
   * Execute Git update
   */
  static async executeGitUpdate(): Promise<UpdateResult> {
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
          resolve({
            success: true,
            message: 'Git update completed successfully',
            output: output
          })
        } else {
          resolve({
            success: false,
            message: 'Git update failed',
            output: output,
            error: error
          })
        }
      })

      // Timeout for git updates too
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Update initiated - application restarting',
          output: 'The update process is running in the background'
        })
      }, 60000) // 60 seconds timeout for git updates
    })
  }

  /**
   * Execute Docker Compose update
   */
  static async executeComposeUpdate(): Promise<UpdateResult> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { spawn } = require('child_process')

    return new Promise((resolve) => {
      const updateScript = `
        echo "Pulling latest changes from git..."
        git pull origin main || git pull origin master
        echo "Pulling latest Docker images..."
        docker compose pull
        echo "Rebuilding and restarting services..."
        docker compose up -d --build
        echo "Docker Compose update completed!"
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
          resolve({
            success: true,
            message: 'Docker Compose update completed successfully',
            output: output
          })
        } else {
          resolve({
            success: false,
            message: 'Docker Compose update failed',
            output: output,
            error: error
          })
        }
      })

      // Timeout for compose updates
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Update initiated - services restarting',
          output: 'The update process is running in the background'
        })
      }, 45000) // 45 seconds timeout for compose
    })
  }

  /**
   * Detect deployment method
   */
  static async detectDeploymentMethod(): Promise<'compose' | 'docker' | 'git'> {
    // Check for Docker Compose environment variables
    if (process.env.COMPOSE_PROJECT_NAME ||
      process.env.COMPOSE_SERVICE ||
      process.env.COMPOSE_FILE) {
      return 'compose'
    }

    // Check if running in Docker container
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs')

      // Check for .dockerenv file (indicates running in Docker)
      if (fs.existsSync('/.dockerenv')) {
        return 'docker'
      }

      // Check for docker-compose.yml in working directory
      if (fs.existsSync('docker-compose.yml') ||
        fs.existsSync('docker-compose.yaml') ||
        fs.existsSync('compose.yml') ||
        fs.existsSync('compose.yaml')) {
        return 'compose'
      }
    } catch {
      // File system checks failed, continue with other detection
    }

    // Check if git repository exists
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs')
      if (fs.existsSync('.git')) {
        return 'git'
      }
    } catch {
      // Git check failed
    }

    // Default to docker if running in production-like environment
    if (process.env.NODE_ENV === 'production') {
      return 'docker'
    }

    // Default to git for development
    return 'git'
  }

  /**
   * Get deployment configuration information
   */
  static async getDeploymentInfo(): Promise<DeploymentInfo> {
    const method = await this.detectDeploymentMethod()
    if (method === 'docker') {
      const config = await this.getCurrentContainerConfig()
      return { method, config }
    }

    return { method }
  }

  /**
   * Determine update method and execute update
   */
  static async executeUpdate(method?: 'docker' | 'git' | 'compose', config?: any) {
    const deploymentMethod = method || await this.detectDeploymentMethod()

    switch (deploymentMethod) {
      case 'compose':
        return await this.executeComposeUpdate()
      case 'docker':
        return await this.executeDockerUpdate(config)
      case 'git':
        return await this.executeGitUpdate()
      default:
        return {
          success: false,
          message: 'Unknown deployment method',
          error: 'Could not determine how to update the application'
        }
    }
  }
}