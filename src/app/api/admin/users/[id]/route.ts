import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware'
import { prisma } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const currentUser = await requireAdmin()
    
    const { id: userIdToDelete } = await params

    // Prevent self-deletion
    if (currentUser.userId === userIdToDelete) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Check if user to delete exists
    const userToDelete = await prisma.user.findUnique({
      where: { id: userIdToDelete }
    })

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Failsafe: If user to delete is an admin, ensure at least one admin will remain
    if (userToDelete.isAdmin) {
      const adminCount = await prisma.user.count({
        where: { isAdmin: true }
      })

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last admin user. At least one admin must exist.' },
          { status: 400 }
        )
      }
    }

    // Delete the user (projects will cascade delete automatically)
    await prisma.user.delete({
      where: { id: userIdToDelete }
    })

    return NextResponse.json({
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('Delete user error:', error)

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