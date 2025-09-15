import { CreateProjectData } from '@/types'

export async function createProject(projectData: CreateProjectData) {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(projectData),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to create project')
  }

  return response.json()
}

export async function updateProject(projectId: string, projectData: CreateProjectData) {
  const response = await fetch(`/api/projects/${projectId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(projectData),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to update project')
  }

  return response.json()
}

export async function getProjects(search?: string, status?: string) {
  const params = new URLSearchParams()
  if (search) params.append('search', search)
  if (status && status !== 'all') params.append('status', status)

  const response = await fetch(`/api/projects?${params}`)

  if (!response.ok) {
    throw new Error('Failed to fetch projects')
  }

  return response.json()
}

export async function deleteProject(projectId: string) {
  const response = await fetch(`/api/projects/${projectId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to delete project')
  }

  return response.json()
}