import { User } from './user'

export interface AdminUser extends User {
  isAdmin: true
}

export interface VersionInfo {
  currentVersion: string
  latestVersion: string
  hasUpdate: boolean
  releaseNotes?: string
}

export interface CreateUserRequest {
  email: string
  password: string
  name?: string
  isAdmin?: boolean
}

export interface AdminStatsResponse {
  totalUsers: number
  totalProjects: number
  adminUsers: number
}