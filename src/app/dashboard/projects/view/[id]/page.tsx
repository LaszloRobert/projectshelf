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
    <div className="min-h-screen bg-gray-50">
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
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                <Badge className={statusColors[project.status as keyof typeof statusColors]}>
                  {formatStatus(project.status)}
                </Badge>
              </div>
              {project.description && (
                <p className="text-gray-600 text-lg leading-relaxed">
                  {project.description}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2 ml-6">
              <Button
                variant="outline"
                onClick={handleEdit}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Project Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Links */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <ExternalLink className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Quick Links</h2>
            </div>
            <div className="space-y-3">
              {project.gitUrl && (
                <a
                  href={project.gitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                    <Github className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">GitHub Repository</p>
                    <p className="text-xs text-gray-500">View source code</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                </a>
              )}
              
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Globe className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">Live Website</p>
                    <p className="text-xs text-gray-500">View live demo</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                </a>
              )}
              
              {!project.gitUrl && !project.liveUrl && (
                <div className="text-center py-8">
                  <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4">
                    <ExternalLink className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">No links available</p>
                  <p className="text-xs text-gray-400">Add GitHub or live URL to see quick links</p>
                </div>
              )}
            </div>
          </div>

          {/* Project Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Code className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Project Details</h2>
            </div>
            <div className="space-y-4">
              {project.techStack && (
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg mt-1">
                    <Code className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-2 text-sm">Tech Stack</p>
                    <div className="flex flex-wrap gap-2">
                      {project.techStack.split(',').map((tech, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium"
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
                    <p className="font-medium text-gray-900 text-sm">Version</p>
                    <p className="text-gray-600 text-sm">{project.version}</p>
                  </div>
                </div>
              )}
              
              {(project.domainProvider || project.hostingProvider) && (
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-lg mt-1">
                    <Server className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">Hosting</p>
                    <div className="text-gray-600 space-y-1 text-sm">
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
                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg mt-1">
                  <Calendar className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">Created</p>
                  <p className="text-gray-600 text-sm">{new Date(project.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg mt-1">
                  <Calendar className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">Last Updated</p>
                  <p className="text-gray-600 text-sm">{new Date(project.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes & Lessons */}
          {(project.notes || project.lessonLearned) && (
            <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="h-5 w-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-900">Notes & Lessons</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {project.notes && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2 text-sm">Notes</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-wrap text-sm">{project.notes}</p>
                    </div>
                  </div>
                )}
                {project.lessonLearned && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2 text-sm">Lessons Learned</h3>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-wrap text-sm">{project.lessonLearned}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags & Platform */}
          {(project.tags || project.platform) && (
            <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tags */}
                {project.tags && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Tag className="h-5 w-5 text-pink-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.split(',').map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-xs font-medium"
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
                      <h3 className="text-lg font-semibold text-gray-900">Platform</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.platform.split(',').map((platform, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
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