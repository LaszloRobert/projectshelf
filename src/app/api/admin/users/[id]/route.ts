import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { AuthService } from '@/lib/services/auth-service'
import { AdminService } from '@/lib/services/admin-service'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const currentUser = await requireAdmin()
    
    const { id: userIdToDelete } = await params

    // Validate user deletion using service
    await AdminService.validateUserDeletion(currentUser.userId, userIdToDelete)

    // Delete the user using service
    await AuthService.deleteUser(userIdToDelete)

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

      if (error.message === 'User not found') {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }

      if (error.message === 'Cannot delete your own account' ||
          error.message.includes('Cannot delete the last admin user')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}