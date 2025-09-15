import bcrypt from 'bcryptjs'
import { prisma } from '../db'

/**
 * Authentication Service - Server-side business logic for authentication
 * Used by API routes for user management and authentication operations
 */
export class AuthService {
  /**
   * Hash a plain text password
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  }

  /**
   * Verify a password against its hash
   */
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }

  /**
   * Create initial admin user if none exists
   */
  static async createAdminUser() {
    // Check if any admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { isAdmin: true }
    })

    if (existingAdmin) {
      return existingAdmin
    }

    // Create initial admin user only if no admin exists
    const adminEmail = 'admin@email.com'
    const adminPassword = 'changeme'
    const hashedPassword = await this.hashPassword(adminPassword)

    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Admin',
        isAdmin: true
      }
    })

    return adminUser
  }

  /**
   * Authenticate user with email and password
   */
  static async authenticateUser(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return null
    }

    const isValid = await this.verifyPassword(password, user.password)
    if (!isValid) {
      return null
    }

    // Return user without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  /**
   * Get user by ID (without password)
   */
  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true,
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    return user
  }

  /**
   * Create a new user (admin function)
   */
  static async createUser(data: {
    email: string
    password: string
    name?: string
    isAdmin?: boolean
  }) {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      throw new Error('Email is already in use')
    }

    // Hash password
    const hashedPassword = await this.hashPassword(data.password)

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name || null,
        isAdmin: data.isAdmin || false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true,
      }
    })

    return newUser
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(
    userId: string, 
    data: { 
      email?: string
      newPassword?: string 
    },
    currentPassword: string
  ) {
    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Verify current password
    const isValidPassword = await this.verifyPassword(currentPassword, user.password)
    if (!isValidPassword) {
      throw new Error('Invalid current password')
    }

    // Check if email is taken by another user
    if (data.email && data.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      })

      if (existingUser && existingUser.id !== userId) {
        throw new Error('Email is already in use')
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (data.email) updateData.email = data.email
    if (data.newPassword) updateData.password = await this.hashPassword(data.newPassword)

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true
      }
    })

    return updatedUser
  }

  /**
   * Get all users (admin function)
   */
  static async getAllUsers() {
    const users = await prisma.user.findMany({
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
      orderBy: {
        createdAt: 'desc'
      }
    })

    return users
  }

  /**
   * Delete user (admin function)
   */
  static async deleteUser(userId: string) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Delete user (projects will be cascade deleted by Prisma)
    await prisma.user.delete({
      where: { id: userId }
    })

    return { success: true }
  }

  /**
   * Update user details (admin function)
   */
  static async updateUser(userId: string, data: {
    email?: string
    name?: string
    isAdmin?: boolean
    newPassword?: string
  }) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      throw new Error('User not found')
    }

    // Check if email is taken by another user
    if (data.email && data.email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: data.email }
      })

      if (emailTaken && emailTaken.id !== userId) {
        throw new Error('Email is already in use')
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (data.email) updateData.email = data.email
    if (data.name !== undefined) updateData.name = data.name
    if (data.isAdmin !== undefined) updateData.isAdmin = data.isAdmin
    if (data.newPassword) updateData.password = await this.hashPassword(data.newPassword)

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return updatedUser
  }
}