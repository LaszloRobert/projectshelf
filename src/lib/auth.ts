import bcrypt from 'bcryptjs'
import { prisma } from './db'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createAdminUser() {
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
  const hashedPassword = await hashPassword(adminPassword)

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

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    return null
  }

  const isValid = await verifyPassword(password, user.password)
  console.log('Is valid password:', isValid)
  if (!isValid) {
    return null
  }

  // Return user without password
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, ...userWithoutPassword } = user
  return userWithoutPassword
} 