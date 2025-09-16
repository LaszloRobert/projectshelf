import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { AuthService } from '@/lib/services/auth-service'
import { updateProfileSchema } from '@/lib/validations'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'

export async function PUT(request: NextRequest) {
  try {
    // Require authentication
    const authUser = await requireAuth()

    const body = await request.json()

    // Validate input
    const validatedData = updateProfileSchema.parse(body)

    // Update user profile using service
    const updatedUser = await AuthService.updateUserProfile(
      authUser.userId,
      {
        email: validatedData.email,
        newPassword: validatedData.newPassword
      },
      validatedData.currentPassword
    )

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