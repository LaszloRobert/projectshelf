'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { User as UserIcon, Users, Shield, Plus, UserPlus, Trash2 } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import { User, UserWithProjectCount, CreateUserData, UpdateProfileFormData } from '@/types/user'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<UserWithProjectCount[]>([])
  const [loading, setLoading] = useState(true)
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false)
  const router = useRouter()

  // Profile form state
  const [profileData, setProfileData] = useState<UpdateProfileFormData>({
    currentPassword: '',
    email: '',
    newPassword: ''
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')

  // Create user form state
  const [createUserData, setCreateUserData] = useState<CreateUserData>({
    email: '',
    password: '',
    name: '',
    isAdmin: false
  })
  const [createUserLoading, setCreateUserLoading] = useState(false)
  const [createUserError, setCreateUserError] = useState('')

  // Delete user state
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [deleteUserLoading, setDeleteUserLoading] = useState(false)
  const [deleteUserError, setDeleteUserError] = useState('')

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUser?.isAdmin) {
      fetchUsers()
    }
  }, [currentUser])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data.user)
        setProfileData(prev => ({ ...prev, email: data.user.email }))
      } else if (response.status === 401) {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileError('')
    setProfileSuccess('')

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      setProfileSuccess('Profile updated successfully')
      setProfileData(prev => ({ ...prev, currentPassword: '', newPassword: '' }))
      
      // Update current user if email changed
      if (profileData.email && profileData.email !== currentUser?.email) {
        setCurrentUser(prev => prev ? { ...prev, email: profileData.email! } : prev)
      }
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateUserLoading(true)
    setCreateUserError('')

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createUserData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user')
      }

      // Reset form and close modal
      setCreateUserData({ email: '', password: '', name: '', isAdmin: false })
      setCreateUserModalOpen(false)
      
      // Refresh users list
      fetchUsers()
    } catch (err) {
      setCreateUserError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setCreateUserLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const canDeleteUser = (user: UserWithProjectCount) => {
    // Can't delete yourself
    if (user.id === currentUser?.id) return false
    
    // Can't delete last admin
    if (user.isAdmin) {
      const adminCount = users.filter(u => u.isAdmin).length
      if (adminCount <= 1) return false
    }
    
    return true
  }

  const handleDeleteUser = async (userId: string) => {
    setDeleteUserLoading(true)
    setDeleteUserError('')

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user')
      }

      // Close modal and refresh users list
      setDeleteUserId(null)
      fetchUsers()
    } catch (err) {
      setDeleteUserError(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setDeleteUserLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your profile and system settings</p>
        </div>

        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg max-w-md">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === 'profile'
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserIcon className="h-4 w-4" />
              <span>Profile</span>
            </button>
            {currentUser?.isAdmin && (
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'users'
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Users</span>
              </button>
            )}
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Update your email and password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={profileData.currentPassword}
                      onChange={(e) => setProfileData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password (optional)</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={profileData.newPassword}
                      onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
                      minLength={6}
                    />
                  </div>

                  {profileError && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                      {profileError}
                    </div>
                  )}

                  {profileSuccess && (
                    <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                      {profileSuccess}
                    </div>
                  )}

                  <Button type="submit" disabled={profileLoading}>
                    {profileLoading ? 'Updating...' : 'Update Profile'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Users Tab (Admin Only) */}
          {currentUser?.isAdmin && activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">User Management</h2>
                    <p className="text-muted-foreground">Manage users and their permissions</p>
                  </div>
                  
                  <Dialog open={createUserModalOpen} onOpenChange={setCreateUserModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center space-x-2">
                        <Plus className="h-4 w-4" />
                        <span>Create User</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>
                          Add a new user to the system
                        </DialogDescription>
                      </DialogHeader>
                      
                      <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="user-email">Email</Label>
                          <Input
                            id="user-email"
                            type="email"
                            value={createUserData.email}
                            onChange={(e) => setCreateUserData(prev => ({ ...prev, email: e.target.value }))}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="user-password">Password</Label>
                          <Input
                            id="user-password"
                            type="password"
                            value={createUserData.password}
                            onChange={(e) => setCreateUserData(prev => ({ ...prev, password: e.target.value }))}
                            required
                            minLength={6}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="user-name">Name</Label>
                          <Input
                            id="user-name"
                            type="text"
                            value={createUserData.name}
                            onChange={(e) => setCreateUserData(prev => ({ ...prev, name: e.target.value }))}
                            required
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            id="user-admin"
                            type="checkbox"
                            checked={createUserData.isAdmin}
                            onChange={(e) => setCreateUserData(prev => ({ ...prev, isAdmin: e.target.checked }))}
                            className="rounded"
                          />
                          <Label htmlFor="user-admin">Admin user</Label>
                        </div>

                        {createUserError && (
                          <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                            {createUserError}
                          </div>
                        )}

                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setCreateUserModalOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={createUserLoading}>
                            {createUserLoading ? 'Creating...' : 'Create User'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Users Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {users.map((user) => (
                    <Card key={user.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {user.isAdmin ? (
                                <Shield className="h-8 w-8 text-blue-600" />
                              ) : (
                                <UserIcon className="h-8 w-8 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg truncate">
                                {user.name || 'Unnamed User'}
                              </CardTitle>
                              <p className="text-sm text-gray-600 truncate">{user.email}</p>
                            </div>
                          </div>
                          <Badge variant={user.isAdmin ? "default" : "secondary"}>
                            {user.isAdmin ? 'Admin' : 'User'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Projects:</span>
                            <span className="font-medium">{user._count.projects}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Joined:</span>
                            <span className="font-medium">{formatDate(user.createdAt)}</span>
                          </div>
                          <div className="pt-3 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteUserId(user.id)}
                              disabled={!canDeleteUser(user)}
                              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {user.id === currentUser?.id ? 'Cannot delete yourself' : 
                               user.isAdmin && users.filter(u => u.isAdmin).length <= 1 ? 'Last admin' : 'Delete'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {users.length === 0 && (
                  <div className="text-center py-12">
                    <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No users</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new user.</p>
                  </div>
                )}
              </div>
          )}
        </div>

        {/* Delete User Confirmation Modal */}
        <Dialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this user? This action cannot be undone and will also delete all their projects.
              </DialogDescription>
            </DialogHeader>
            
            {deleteUserError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {deleteUserError}
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDeleteUserId(null)}
                disabled={deleteUserLoading}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="destructive"
                onClick={() => deleteUserId && handleDeleteUser(deleteUserId)}
                disabled={deleteUserLoading}
              >
                {deleteUserLoading ? 'Deleting...' : 'Delete User'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}