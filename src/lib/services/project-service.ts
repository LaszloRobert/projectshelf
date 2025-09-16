import { prisma } from '../db'
import { CreateProjectData, UpdateProjectData, ProjectStatus } from '@/types'

/**
 * Project Service - Server-side business logic for projects
 * Used by API routes for project operations
 */
export class ProjectService {
  /**
   * Get user's projects with optional filtering
   */
  static async getUserProjects(
    userId: string, 
    filters?: { search?: string; status?: string }
  ) {
    const where: any = { userId }

    // Add search filter
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { description: { contains: filters.search } },
        { techStack: { contains: filters.search } },
        { tags: { contains: filters.search } }
      ]
    }

    // Add status filter
    if (filters?.status && filters.status !== 'all') {
      where.status = filters.status.toUpperCase() as ProjectStatus
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { updatedAt: 'desc' }
    })

    return projects
  }

  /**
   * Get a specific project by ID (with ownership check)
   */
  static async getProjectById(projectId: string, userId: string) {
    const project = await prisma.project.findFirst({
      where: { 
        id: projectId,
        userId // Ensure user owns the project
      }
    })

    return project
  }

  /**
   * Create a new project
   */
  static async createProject(userId: string, data: CreateProjectData) {
    const project = await prisma.project.create({
      data: {
        ...data,
        userId
      }
    })

    return project
  }

  /**
   * Update an existing project (with ownership check)
   */
  static async updateProject(projectId: string, userId: string, data: UpdateProjectData) {
    // Verify ownership
    const existingProject = await this.getProjectById(projectId, userId)
    if (!existingProject) {
      throw new Error('Project not found or access denied')
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...data,
        status: data.status ? data.status.toUpperCase() as ProjectStatus : undefined
      }
    })

    return updatedProject
  }

  /**
   * Delete a project (with ownership check)
   */
  static async deleteProject(projectId: string, userId: string) {
    // Verify ownership
    const existingProject = await this.getProjectById(projectId, userId)
    if (!existingProject) {
      throw new Error('Project not found or access denied')
    }

    await prisma.project.delete({
      where: { id: projectId }
    })

    return { success: true }
  }

  /**
   * Get project count for user
   */
  static async getUserProjectCount(userId: string): Promise<number> {
    return prisma.project.count({
      where: { userId }
    })
  }

  /**
   * Get all projects (admin function)
   */
  static async getAllProjects() {
    const projects = await prisma.project.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return projects
  }
}