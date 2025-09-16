import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { AuthService } from '@/lib/services/auth-service'

export async function GET() {
  try {
    // Require authentication
    const authUser = await requireAuth()

    // Get current user using service
    const user = await AuthService.getUserById(authUser.userId)
    
    return NextResponse.json({ user })
    
  } catch (error) {
    console.error('Get user error:', error)

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      if (error.message === 'User not found') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}