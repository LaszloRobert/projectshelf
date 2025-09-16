import { promises as fs } from 'fs'
import { createWriteStream } from 'fs'
import * as tar from 'tar'
import path from 'path'

export interface UpdateProgress {
  stage: 'starting' | 'downloading' | 'extracting' | 'backing_up' | 'updating' | 'restarting' | 'completed' | 'error'
  message: string
  progress?: number
  error?: string
  backupPath?: string
}

export interface UpdateResult {
  success: boolean
  message: string
  error?: string
  backupPath?: string
}

export class InPlaceUpdateService {
  private static readonly UPDATE_DIR = '/tmp/projectshelf-update'
  private static readonly BACKUP_DIR = '/tmp/projectshelf-backup'
  private static readonly APP_DIR = '/app'

  // Progress callback for real-time updates
  private static progressCallback: ((progress: UpdateProgress) => void) | null = null

  static setProgressCallback(callback: (progress: UpdateProgress) => void) {
    this.progressCallback = callback
  }

  private static emitProgress(progress: UpdateProgress) {
    if (this.progressCallback) {
      this.progressCallback(progress)
    }
  }

  /**
   * Execute complete in-place update process
   */
  static async executeUpdate(latestVersion: string): Promise<UpdateResult> {
    // Prevent updates in development environment
    if (process.env.NODE_ENV === 'development') {
      return {
        success: false,
        message: 'Updates are disabled in development environment',
        error: 'Cannot run updates in development mode'
      }
    }

    try {
      this.emitProgress({
        stage: 'downloading',
        message: 'Starting update process...',
        progress: 0
      })

      // Step 1: Download update package
      const downloadPath = await this.downloadUpdatePackage(latestVersion)

      this.emitProgress({
        stage: 'extracting',
        message: 'Extracting update files...',
        progress: 25
      })

      // Step 2: Extract update package
      await this.extractUpdatePackage(downloadPath)

      this.emitProgress({
        stage: 'backing_up',
        message: 'Creating backup of current version...',
        progress: 50
      })

      // Step 3: Create backup
      const backupPath = await this.createBackup()

      this.emitProgress({
        stage: 'updating',
        message: 'Applying update files...',
        progress: 75
      })

      // Step 4: Apply update
      await this.applyUpdate()

      // Step 5: Run database migrations if needed
      await this.runMigrations()

      this.emitProgress({
        stage: 'restarting',
        message: 'Restarting application...',
        progress: 95
      })

      // Step 6: Cleanup
      await this.cleanup()

      this.emitProgress({
        stage: 'restarting',
        message: 'Update completed! Restarting application...',
        progress: 100
      })

      // Step 7: Immediate restart
      setTimeout(() => {
        process.exit(0) // Docker will automatically restart the container
      }, 500) // Just 0.5 seconds

      return {
        success: true,
        message: 'Update completed successfully',
        backupPath
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

      this.emitProgress({
        stage: 'error',
        message: 'Update failed',
        error: errorMessage
      })

      // Attempt rollback if we have a backup
      try {
        await this.rollback()
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError)
      }

      return {
        success: false,
        message: 'Update failed',
        error: errorMessage
      }
    }
  }

  /**
   * Download the built update package from GitHub releases
   */
  private static async downloadUpdatePackage(version: string): Promise<string> {
    try {
      const downloadUrl = `https://github.com/LaszloRobert/projectshelf/releases/download/${version}/projectshelf-built-${version}.tar.gz`

      this.emitProgress({
        stage: 'downloading',
        message: `Downloading ${version} from GitHub...`,
        progress: 10
      })

      const response = await fetch(downloadUrl, {
        headers: {
          'User-Agent': 'ProjectShelf-Updater/1.0'
        },
        signal: AbortSignal.timeout(300000) // 5 minute timeout
      })

      if (!response.ok) {
        throw new Error(`Failed to download update: ${response.status} ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error('No response body received')
      }

      // Ensure update directory exists
      await fs.mkdir(path.dirname(this.UPDATE_DIR), { recursive: true })

      const downloadPath = path.join(path.dirname(this.UPDATE_DIR), `projectshelf-${version}.tar.gz`)
      const fileStream = createWriteStream(downloadPath)

      // Track download progress if content-length is available
      const contentLength = response.headers.get('content-length')
      let downloadedBytes = 0

      const reader = response.body.getReader()

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        fileStream.write(value)
        downloadedBytes += value.length

        if (contentLength) {
          const progress = 10 + (downloadedBytes / parseInt(contentLength)) * 15
          this.emitProgress({
            stage: 'downloading',
            message: `Downloaded ${Math.round(downloadedBytes / 1024 / 1024 * 100) / 100}MB...`,
            progress: Math.round(progress)
          })
        }
      }

      fileStream.end()

      // Wait for file to be written
      await new Promise<void>((resolve, reject) => {
        fileStream.on('finish', () => resolve())
        fileStream.on('error', (error) => reject(error))
      })

      return downloadPath

    } catch (error) {
      throw new Error(`Failed to download update package: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Extract the downloaded tar.gz package
   */
  private static async extractUpdatePackage(packagePath: string): Promise<void> {
    try {
      // Clean up existing update directory
      await fs.rm(this.UPDATE_DIR, { recursive: true, force: true })
      await fs.mkdir(this.UPDATE_DIR, { recursive: true })

      this.emitProgress({
        stage: 'extracting',
        message: 'Extracting update files...',
        progress: 30
      })

      // Extract tar.gz file using tar library
      await tar.x({
        file: packagePath,
        cwd: this.UPDATE_DIR,
        strip: 1 // Remove the top-level directory from extraction
      })

      this.emitProgress({
        stage: 'extracting',
        message: 'Update files extracted successfully',
        progress: 40
      })

      // Verify extraction
      const extractedFiles = await fs.readdir(this.UPDATE_DIR)
      if (extractedFiles.length === 0) {
        throw new Error('No files were extracted from the update package')
      }

      console.log('Extracted files:', extractedFiles)

    } catch (error) {
      throw new Error(`Failed to extract update package: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create backup of current application
   */
  private static async createBackup(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupPath = `${this.BACKUP_DIR}-${timestamp}`

      // Clean up existing backup directory
      await fs.rm(this.BACKUP_DIR, { recursive: true, force: true })
      await fs.mkdir(this.BACKUP_DIR, { recursive: true })

      this.emitProgress({
        stage: 'backing_up',
        message: 'Creating backup of critical files...',
        progress: 55
      })

      // Backup critical directories and files
      const criticalPaths = ['.next', 'package.json', 'package-lock.json']

      for (const pathName of criticalPaths) {
        const sourcePath = path.join(this.APP_DIR, pathName)
        const destPath = path.join(this.BACKUP_DIR, pathName)

        try {
          await fs.access(sourcePath)
          await fs.cp(sourcePath, destPath, { recursive: true })
        } catch (error) {
          // Some files might not exist, that's okay
          console.log(`Backup: ${pathName} not found, skipping`)
        }
      }

      // Rename to timestamped backup
      await fs.rename(this.BACKUP_DIR, backupPath)

      this.emitProgress({
        stage: 'backing_up',
        message: 'Backup created successfully',
        progress: 65
      })

      return backupPath

    } catch (error) {
      throw new Error(`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Apply the update by copying new files
   */
  private static async applyUpdate(): Promise<void> {
    try {
      this.emitProgress({
        stage: 'updating',
        message: 'Copying new application files...',
        progress: 80
      })

      const updateFiles = await fs.readdir(this.UPDATE_DIR)

      for (const file of updateFiles) {
        if (file === 'start.sh') continue // Skip startup script

        const sourcePath = path.join(this.UPDATE_DIR, file)
        const destPath = path.join(this.APP_DIR, file)

        this.emitProgress({
          stage: 'updating',
          message: `Updating ${file}...`,
          progress: 80 + (updateFiles.indexOf(file) / updateFiles.length) * 10
        })

        await fs.cp(sourcePath, destPath, { recursive: true })
      }

      this.emitProgress({
        stage: 'updating',
        message: 'Application files updated successfully',
        progress: 90
      })

    } catch (error) {
      throw new Error(`Failed to apply update: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Run database migrations if needed
   */
  private static async runMigrations(): Promise<void> {
    try {
      this.emitProgress({
        stage: 'updating',
        message: 'Running database migrations...',
        progress: 92
      })

      // Run prisma db push to ensure database is up to date
      const { spawn } = require('child_process')

      await new Promise<void>((resolve) => {
        const migrateProcess = spawn('npx', ['prisma', 'db', 'push'], {
          cwd: this.APP_DIR,
          stdio: 'pipe'
        })

        let output = ''
        let errorOutput = ''

        migrateProcess.stdout?.on('data', (data: Buffer) => {
          output += data.toString()
        })

        migrateProcess.stderr?.on('data', (data: Buffer) => {
          errorOutput += data.toString()
        })

        migrateProcess.on('close', (code: number | null) => {
          if (code === 0) {
            console.log('Database migrations completed:', output)
            resolve()
          } else {
            console.error('Migration failed:', errorOutput)
            // Don't fail the entire update for migration issues
            resolve()
          }
        })

        migrateProcess.on('error', (error: Error) => {
          console.error('Migration process error:', error)
          // Don't fail the entire update for migration issues
          resolve()
        })
      })

    } catch (error) {
      console.error('Migration error:', error)
      // Don't fail the entire update for migration issues
    }
  }

  /**
   * Rollback to backup if update fails
   */
  private static async rollback(): Promise<void> {
    try {
      console.log('Attempting rollback...')

      // Find the most recent backup
      const backupDir = path.dirname(this.BACKUP_DIR)
      const backupDirs = await fs.readdir(backupDir)
      const projectBackups = backupDirs
        .filter(dir => dir.startsWith(path.basename(this.BACKUP_DIR)))
        .sort()
        .reverse()

      if (projectBackups.length === 0) {
        console.error('No backup found for rollback')
        return
      }

      const latestBackup = path.join(backupDir, projectBackups[0])
      console.log('Rolling back from:', latestBackup)

      // Restore critical files
      const backupFiles = await fs.readdir(latestBackup)
      for (const file of backupFiles) {
        const sourcePath = path.join(latestBackup, file)
        const destPath = path.join(this.APP_DIR, file)
        await fs.cp(sourcePath, destPath, { recursive: true })
      }

      console.log('Rollback completed')

    } catch (error) {
      console.error('Rollback failed:', error)
      throw new Error(`Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Cleanup temporary files
   */
  private static async cleanup(): Promise<void> {
    try {
      // Remove update directory
      await fs.rm(this.UPDATE_DIR, { recursive: true, force: true })

      // Keep backups for debugging but remove old ones (keep last 3)
      const backupDir = path.dirname(this.BACKUP_DIR)
      const backupDirs = await fs.readdir(backupDir)
      const projectBackups = backupDirs
        .filter(dir => dir.startsWith(path.basename(this.BACKUP_DIR)))
        .sort()
        .reverse()

      // Remove old backups (keep last 3)
      for (let i = 3; i < projectBackups.length; i++) {
        const oldBackup = path.join(backupDir, projectBackups[i])
        await fs.rm(oldBackup, { recursive: true, force: true })
      }

    } catch (error) {
      console.error('Cleanup error:', error)
      // Don't fail for cleanup errors
    }
  }
}