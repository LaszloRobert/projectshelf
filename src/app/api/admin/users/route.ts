import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { AuthService } from '@/lib/services/auth-service'
import { createUserSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin()
    
    const body = await request.json()
    
    // Validate input
    const validatedData = createUserSchema.parse(body)
    
    // Create user using service
    const newUser = await AuthService.createUser({
      email: validatedData.email,
      password: validatedData.password,
      name: validatedData.name,
      isAdmin: validatedData.isAdmin || false
    })
    
    return NextResponse.json({
      message: 'User created successfully',
      user: newUser
    })
    
  } catch (error) {
    console.error('Create user error:', error)
    
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
      
      if (error.message === 'Admin access required') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Require admin authentication
    await requireAdmin()
    
    // Get all users using service
    const users = await AuthService.getAllUsers()
    
    return NextResponse.json({ users })
    
  } catch (error) {
    console.error('Get users error:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      
      if (error.message === 'Admin access required') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}