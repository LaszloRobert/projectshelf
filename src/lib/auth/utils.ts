import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { AuthUser } from '@/types'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'

export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (!token) {
      return null
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser
    return decoded
  } catch (error) {
    console.error('Auth verification error:', error)
    return null
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  return user
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth()
  
  if (!user.isAdmin) {
    throw new Error('Admin access required')
  }
  
  return user
}