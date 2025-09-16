// Admin-specific API calls for self-hosted version

export async function getUsers() {
  const response = await fetch('/api/admin/users')
  
  if (!response.ok) {
    throw new Error('Failed to fetch users')
  }
  
  return response.json()
}

export async function createUser(userData: { email: string; password: string; name?: string; isAdmin?: boolean }) {
  const response = await fetch('/api/admin/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to create user')
  }

  return response.json()
}

export async function deleteUser(userId: string) {
  const response = await fetch(`/api/admin/users/${userId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to delete user')
  }

  return response.json()
}

export async function checkForUpdates() {
  const response = await fetch('/api/admin/version')
  
  if (!response.ok) {
    throw new Error('Failed to check for updates')
  }
  
  return response.json()
}