import { useState, useCallback } from 'react'
import { CreateProjectData } from '@/types'
import { createProject, updateProject } from '@/lib/client/projects'

const initialFormData: CreateProjectData = {
  name: '',
  description: '',
  status: 'PLANNING',
  gitUrl: '',
  liveUrl: '',
  domainProvider: '',
  hostingProvider: '',
  techStack: '',
  version: '',
  notes: '',
  lessonLearned: '',
  tags: '',
  platform: ''
}

export function useProjectForm(
  initialData?: CreateProjectData,
  projectId?: string,
  onSuccess?: () => void
) {
  const [formData, setFormData] = useState<CreateProjectData>(initialData || initialFormData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isEditMode = !!projectId

  const resetForm = useCallback(() => {
    setFormData(initialData || initialFormData)
    setError('')
  }, [initialData])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isEditMode && projectId) {
        await updateProject(projectId, formData)
      } else {
        await createProject(formData)
      }

      resetForm()
      onSuccess?.()
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} project:`, error)
      setError(error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'create'} project. Please try again.`)
    } finally {
      setLoading(false)
    }
  }, [formData, isEditMode, projectId, resetForm, onSuccess])

  return {
    formData,
    loading,
    error,
    isEditMode,
    handleChange,
    handleSubmit,
    resetForm
  }
}