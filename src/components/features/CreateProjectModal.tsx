'use client'

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
import { useProjectForm } from '@/hooks/useProjectForm'

interface CreateProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProjectCreated: () => void
  initialData?: CreateProjectData
  projectId?: string
}

export default function CreateProjectModal({ 
  open, 
  onOpenChange, 
  onProjectCreated,
  initialData,
  projectId
}: CreateProjectModalProps) {
  const {
    formData,
    loading,
    error,
    isEditMode,
    handleChange,
    handleSubmit,
    resetForm
  } = useProjectForm(initialData, projectId, () => {
    onOpenChange(false)
    onProjectCreated()
  })


  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      resetForm()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Project' : 'Create New Project'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm">Project Name *</Label>
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
                className="h-9 sm:h-10"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm">Status</Label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 h-9 sm:h-10 rounded-md border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-card dark:[color-scheme:dark] text-sm"
              >
                <option value="PLANNING">Planning</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter project description"
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="gitUrl" className="text-sm">Git Repository URL</Label>
              <Input
                id="gitUrl"
                name="gitUrl"
                value={formData.gitUrl}
                onChange={handleChange}
                placeholder="https://github.com/..."
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="liveUrl" className="text-sm">Live URL</Label>
              <Input
                id="liveUrl"
                name="liveUrl"
                value={formData.liveUrl}
                onChange={handleChange}
                placeholder="https://yourproject.com"
                className="h-9 sm:h-10 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="techStack" className="text-sm">Tech Stack</Label>
              <Input
                id="techStack"
                name="techStack"
                value={formData.techStack}
                onChange={handleChange}
                placeholder="React, Node.js, MongoDB"
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="version" className="text-sm">Version</Label>
              <Input
                id="version"
                name="version"
                value={formData.version}
                onChange={handleChange}
                placeholder="1.0.0"
                className="h-9 sm:h-10 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="domain" className="text-sm">Domain Provider</Label>
              <Input
                id="domainProvider"
                name="domainProvider"
                value={formData.domainProvider}
                onChange={handleChange}
                placeholder="Namecheap, GoDaddy, etc."
                className="h-9 sm:h-10 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hostingProvider" className="text-sm">Hosting Provider</Label>
              <Input
                id="hostingProvider"
                name="hostingProvider"
                value={formData.hostingProvider}
                onChange={handleChange}
                placeholder="Vercel, Netlify, etc."
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags" className="text-sm">Tags</Label>
              <Input
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="personal, important, favorite"
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="platform" className="text-sm">Platform</Label>
              <Input
                id="platform"
                name="platform"
                value={formData.platform}
                onChange={handleChange}
                placeholder="web, mobile, desktop, api"
                className="h-9 sm:h-10 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes about the project"
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lessonLearned" className="text-sm">Lessons Learned</Label>
            <Textarea
              id="lessonLearned"
              name="lessonLearned"
              value={formData.lessonLearned}
              onChange={handleChange}
              placeholder="What did you learn from this project?"
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded break-words">
              {error}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto order-1 sm:order-2">
              {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Project' : 'Create Project')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}