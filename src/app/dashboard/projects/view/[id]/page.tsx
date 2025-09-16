'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Trash2, ExternalLink, Github, Globe, Calendar, Tag, Code, Server } from 'lucide-react'
import { Project } from '@/types/project'
import { statusColors, formatStatus } from '@/lib/utils'
import toast, { Toaster } from 'react-hot-toast'
import DeleteConfirmationModal from '@/components/ui/delete-confirmation-modal'
import CreateProjectModal from '@/components/features/CreateProjectModal'

export default function ProjectViewPage() {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        if (response.status === 404) {
          toast.error('Project not found')
          router.push('/dashboard')
          return
        }
        throw new Error('Failed to fetch project')
      }

      const data = await response.json()
      setProject(data.project)
    } catch (error) {
      console.error('Error fetching project:', error)
      toast.error('Failed to load project')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    setEditModalOpen(true)
  }

  const handleEditComplete = () => {
    fetchProject() // Refresh the project data after edit
    toast.success('Project updated successfully!')
  }

  const handleDelete = () => {
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!project) return
    
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Authentication required')
          router.push('/login')
          return
        }
        if (response.status === 404) {
          toast.error('Project not found')
          return
        }
        throw new Error('Failed to delete project')
      }
      
      toast.success('Project deleted successfully')
      setDeleteModalOpen(false)
      router.push('/dashboard')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete project')
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Project not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Button>
        </div>

        {/* Header */}
        <div className="bg-card text-card-foreground rounded-lg border border-border p-4 sm:p-6 mb-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
            <div className="flex-1 min-w-0">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3 mb-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words">{project.name}</h1>
                <Badge className={`${statusColors[project.status as keyof typeof statusColors]} shrink-0`}>
                  {formatStatus(project.status)}
                </Badge>
              </div>
              {project.description && (
                <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                  {project.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 sm:ml-6 shrink-0">
              <Button
                variant="outline"
                onClick={handleEdit}
                className="flex items-center gap-2"
                size="sm"
              >
                <Edit className="h-4 w-4" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                size="sm"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Project Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Quick Links */}
          <div className="bg-card text-card-foreground rounded-lg border border-border p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <ExternalLink className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-foreground">Quick Links</h2>
            </div>
            <div className="space-y-3">
              {project.gitUrl && (
                <a
                  href={project.gitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors group"
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-muted rounded-lg group-hover:bg-accent transition-colors">
                    <Github className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">GitHub Repository</p>
                    <p className="text-xs text-muted-foreground">View source code</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                </a>
              )}
              
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors group"
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Globe className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">Live Website</p>
                    <p className="text-xs text-muted-foreground">View live demo</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                </a>
              )}
              
              {!project.gitUrl && !project.liveUrl && (
                <div className="text-center py-8">
                  <div className="flex items-center justify-center w-16 h-16 bg-muted rounded-lg mx-auto mb-4">
                    <ExternalLink className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-muted-foreground text-sm">No links available</p>
                  <p className="text-xs text-muted-foreground">Add GitHub or live URL to see quick links</p>
                </div>
              )}
            </div>
          </div>

          {/* Project Details */}
          <div className="bg-card text-card-foreground rounded-lg border border-border p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Code className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold text-foreground">Project Details</h2>
            </div>
            <div className="space-y-4">
              {project.techStack && (
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg mt-1 shrink-0">
                    <Code className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground mb-2 text-sm">Tech Stack</p>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {project.techStack.split(',').map((tech, index) => (
                        <span
                          key={index}
                          className="px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium break-words"
                        >
                          {tech.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {project.version && (
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg mt-1">
                    <Tag className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">Version</p>
                    <p className="text-muted-foreground text-sm">{project.version}</p>
                  </div>
                </div>
              )}
              
              {(project.domainProvider || project.hostingProvider) && (
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-lg mt-1">
                    <Server className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">Hosting</p>
                    <div className="text-muted-foreground space-y-1 text-sm">
                      {project.domainProvider && (
                        <p>Domain: {project.domainProvider}</p>
                      )}
                      {project.hostingProvider && (
                        <p>Hosting: {project.hostingProvider}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-lg mt-1">
                  <Calendar className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">Created</p>
                  <p className="text-muted-foreground text-sm">{new Date(project.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-lg mt-1">
                  <Calendar className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">Last Updated</p>
                  <p className="text-muted-foreground text-sm">{new Date(project.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes & Lessons */}
          {(project.notes || project.lessonLearned) && (
            <div className="bg-card text-card-foreground rounded-lg border border-border p-4 sm:p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="h-5 w-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-foreground">Notes & Lessons</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {project.notes && (
                  <div>
                    <h3 className="font-medium text-foreground mb-2 text-sm">Notes</h3>
                    <div className="bg-muted rounded-lg p-3 sm:p-4">
                      <p className="text-muted-foreground whitespace-pre-wrap text-sm break-words">{project.notes}</p>
                    </div>
                  </div>
                )}
                {project.lessonLearned && (
                  <div>
                    <h3 className="font-medium text-foreground mb-2 text-sm">Lessons Learned</h3>
                    <div className="bg-yellow-50 rounded-lg p-3 sm:p-4">
                      <p className="text-muted-foreground whitespace-pre-wrap text-sm break-words">{project.lessonLearned}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags & Platform */}
          {(project.tags || project.platform) && (
            <div className="bg-card text-card-foreground rounded-lg border border-border p-4 sm:p-6 shadow-sm lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Tags */}
                {project.tags && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Tag className="h-5 w-5 text-pink-600" />
                      <h3 className="text-lg font-semibold text-foreground">Tags</h3>
                    </div>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {project.tags.split(',').map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 sm:px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-xs font-medium break-words"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Platform */}
                {project.platform && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Globe className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-foreground">Platform</h3>
                    </div>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {project.platform.split(',').map((platform, index) => (
                        <span
                          key={index}
                          className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium break-words"
                        >
                          {platform.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Project Modal */}
      {project && (
        <CreateProjectModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onProjectCreated={handleEditComplete}
          initialData={{
            name: project.name,
            description: project.description || '',
            status: project.status,
            gitUrl: project.gitUrl || '',
            liveUrl: project.liveUrl || '',
            domainProvider: project.domainProvider || '',
            hostingProvider: project.hostingProvider || '',
            techStack: project.techStack || '',
            version: project.version || '',
            notes: project.notes || '',
            lessonLearned: project.lessonLearned || '',
            tags: project.tags || '',
            platform: project.platform || ''
          }}
          projectId={project.id}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone and all project data will be permanently removed."
        itemName={project?.name || ''}
        isLoading={isDeleting}
      />
    </div>
  )
}