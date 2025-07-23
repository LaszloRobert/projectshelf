import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware'
import { updateProfileSchema } from '@/lib/validations'
import { hashPassword, verifyPassword } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'

export async function PUT(request: NextRequest) {
  try {
    // Require authentication
    const authUser = await requireAuth(request)
    
    const body = await request.json()
    
    // Validate input
    const validatedData = updateProfileSchema.parse(body)
    
    // Get current user from database
    const currentUser = await prisma.user.findUnique({
      where: { id: authUser.userId }
    })
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(
      validatedData.currentPassword,
      currentUser.password
    )
    
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      )
    }
    
    // Prepare update data
    const updateData: any = {}
    
    if (validatedData.email) {
      // Check if email is already taken by another user
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email }
      })
      
      if (existingUser && existingUser.id !== authUser.userId) {
        return NextResponse.json(
          { error: 'Email is already in use' },
          { status: 400 }
        )
      }
      
      updateData.email = validatedData.email
    }
    
    if (validatedData.newPassword) {
      updateData.password = await hashPassword(validatedData.newPassword)
    }
    
    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: authUser.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true
      }
    })
    
    // If email changed, update JWT token
    if (validatedData.email) {
      const newToken = jwt.sign(
        { userId: updatedUser.id, email: updatedUser.email, isAdmin: updatedUser.isAdmin },
        JWT_SECRET,
        { expiresIn: '7d' }
      )
      
      const cookieStore = await cookies()
      cookieStore.set('auth-token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }
    
    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser
    })
    
  } catch (error) {
    console.error('Update profile error:', error)
    
    if (error instanceof Error) {
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Invalid input data' },
          { status: 400 }
        )
      }
      
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}