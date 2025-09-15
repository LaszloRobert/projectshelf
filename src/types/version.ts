export interface GitHubRelease {
  tag_name: string
  name: string
  published_at: string
  html_url: string
  body: string
  draft: boolean
  prerelease: boolean
}

export interface ReleaseInfo {
  name: string
  tag: string
  publishedAt: string
  url: string
  notes: string
}

export interface VersionCheckResult {
  currentVersion: string
  latestVersion?: string
  hasUpdate: boolean
  releaseInfo?: ReleaseInfo | null
  error?: string
  message?: string
}

export interface ContainerConfig {
  port: string
  volumes: string[]
  envVars: string[]
  name: string
}

export interface DeploymentInfo {
  method: 'compose' | 'docker' | 'git'
  config?: ContainerConfig
}

export interface UpdateResult {
  success: boolean
  message: string
  output?: string
  error?: string
}