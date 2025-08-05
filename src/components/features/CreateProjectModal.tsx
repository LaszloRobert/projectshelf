'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { CreateProjectData } from '@/types'

interface CreateProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProjectCreated: () => void
  initialData?: CreateProjectData
  projectId?: string
}

// Initial form state - single source of truth
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

export default function CreateProjectModal({ 
  open, 
  onOpenChange, 
  onProjectCreated,
  initialData,
  projectId
}: CreateProjectModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<CreateProjectData>(initialData || initialFormData)
  const isEditMode = !!projectId

  // Reset function - single place to reset form
  const resetForm = useCallback(() => {
    setFormData(initialData || initialFormData)
    setError('')
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = isEditMode ? `/api/projects/${projectId}` : '/api/projects'
      const method = isEditMode ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${isEditMode ? 'update' : 'create'} project`)
      }

      // Reset form and close modal
      resetForm()
      onOpenChange(false)
      onProjectCreated()
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} project:`, error)
      setError(`Failed to ${isEditMode ? 'update' : 'create'} project. Please try again.`)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      resetForm()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Project' : 'Create New Project'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onFocus={(e) => {
                  // Move cursor to end instead of selecting all text
                  const input = e.target as HTMLInputElement
                  setTimeout(() => {
                    input.setSelectionRange(input.value.length, input.value.length)
                  }, 0)
                }}
                required
                placeholder="Enter project name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PLANNING">Planning</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter project description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gitUrl">Git Repository URL</Label>
              <Input
                id="gitUrl"
                name="gitUrl"
                value={formData.gitUrl}
                onChange={handleChange}
                placeholder="https://github.com/..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="liveUrl">Live URL</Label>
              <Input
                id="liveUrl"
                name="liveUrl"
                value={formData.liveUrl}
                onChange={handleChange}
                placeholder="https://yourproject.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="techStack">Tech Stack</Label>
              <Input
                id="techStack"
                name="techStack"
                value={formData.techStack}
                onChange={handleChange}
                placeholder="React, Node.js, MongoDB"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                name="version"
                value={formData.version}
                onChange={handleChange}
                placeholder="1.0.0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain Provider</Label>
              <Input
                id="domainProvider"
                name="domainProvider"
                value={formData.domainProvider}
                onChange={handleChange}
                placeholder="Namecheap, GoDaddy, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hostingProvider">Hosting Provider</Label>
              <Input
                id="hostingProvider"
                name="hostingProvider"
                value={formData.hostingProvider}
                onChange={handleChange}
                placeholder="Vercel, Netlify, etc."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="personal, important, favorite"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Input
                id="platform"
                name="platform"
                value={formData.platform}
                onChange={handleChange}
                placeholder="web, mobile, desktop, api"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes about the project"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lessonLearned">Lessons Learned</Label>
            <Textarea
              id="lessonLearned"
              name="lessonLearned"
              value={formData.lessonLearned}
              onChange={handleChange}
              placeholder="What did you learn from this project?"
              rows={3}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Project' : 'Create Project')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}