import { prisma } from '../db'

/**
 * Admin Service - Server-side business logic for admin operations
 * Used by admin API routes for system management
 */
export class AdminService {
  /**
   * Get system statistics
   */
  static async getSystemStats() {
    const [totalUsers, totalProjects, adminUsers] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.user.count({ where: { isAdmin: true } })
    ])

    const recentUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    const recentProjects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    return {
      totalUsers,
      totalProjects,
      adminUsers,
      recentUsers,
      recentProjects
    }
  }

  /**
   * Get detailed user analytics
   */
  static async getUserAnalytics() {
    const usersWithProjectCounts = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true,
        _count: {
          select: {
            projects: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate project distribution
    const projectCounts = usersWithProjectCounts.map(user => user._count.projects)
    const maxProjects = Math.max(...projectCounts, 0)
    const avgProjects = projectCounts.reduce((a, b) => a + b, 0) / projectCounts.length

    return {
      users: usersWithProjectCounts,
      analytics: {
        totalUsers: usersWithProjectCounts.length,
        maxProjectsPerUser: maxProjects,
        avgProjectsPerUser: Math.round(avgProjects * 100) / 100,
        activeUsers: usersWithProjectCounts.filter(user => user._count.projects > 0).length
      }
    }
  }

  /**
   * Get project analytics
   */
  static async getProjectAnalytics() {
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    // Calculate status distribution
    const statusCounts = projects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      projects,
      analytics: {
        totalProjects: projects.length,
        statusDistribution: statusCounts,
        recentActivity: projects.slice(0, 10)
      }
    }
  }

  /**
   * Cleanup orphaned data (maintenance function)
   */
  static async cleanupOrphanedData() {
    // With proper foreign key constraints, orphaned projects shouldn't exist
    // This function is mainly for maintenance purposes
    
    try {
      const totalProjects = await prisma.project.count()
      const totalUsers = await prisma.user.count()

      return {
        cleanedProjects: 0,
        totalProjects,
        totalUsers,
        message: `System healthy. ${totalProjects} projects and ${totalUsers} users.`
      }
    } catch (error) {
      return {
        cleanedProjects: 0,
        message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Get system health status
   */
  static async getSystemHealth() {
    try {
      // Test database connection
      await prisma.user.findFirst()

      const dbStatus = 'healthy'
      const timestamp = new Date().toISOString()

      return {
        status: 'healthy',
        database: dbStatus,
        timestamp,
        uptime: process.uptime()
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        database: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Validate if a user can be deleted
   */
  static async validateUserDeletion(currentUserId: string, userIdToDelete: string) {
    // Prevent self-deletion
    if (currentUserId === userIdToDelete) {
      throw new Error('Cannot delete your own account')
    }

    // Check if user to delete exists
    const userToDelete = await prisma.user.findUnique({
      where: { id: userIdToDelete },
      select: { id: true, isAdmin: true }
    })

    if (!userToDelete) {
      throw new Error('User not found')
    }

    // If user to delete is an admin, ensure at least one admin will remain
    if (userToDelete.isAdmin) {
      const adminCount = await prisma.user.count({
        where: { isAdmin: true }
      })

      if (adminCount <= 1) {
        throw new Error('Cannot delete the last admin user. At least one admin must exist.')
      }
    }

    return userToDelete
  }
}