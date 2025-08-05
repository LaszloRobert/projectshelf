'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Github, Globe, Eye, Plus, Code } from 'lucide-react'
import Navbar, { NavbarRef } from '@/components/layout/Navbar'
import { Project } from '@/types/project'
import { statusColors, formatStatus } from '@/lib/utils'

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const router = useRouter()
  const navbarRef = useRef<NavbarRef>(null)

  useEffect(() => {
    fetchProjects()
  }, [search, statusFilter])

  const fetchProjects = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/projects?${params}`)

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch projects')
      }

      const data = await response.json()
      setProjects(data.projects)
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProjectCreated = () => {
    fetchProjects()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar ref={navbarRef} onProjectCreated={handleProjectCreated} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white"
          >
            <option value="all">All Status</option>
            <option value="PLANNING">Planning</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first project.</p>
            <Button onClick={() => navbarRef.current?.openCreateModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${statusColors[project.status as keyof typeof statusColors]}`}>
                        {formatStatus(project.status)}
                      </Badge>
                      <div className="flex items-center gap-2">
                        {project.gitUrl && (
                          <a href={project.gitUrl} target="_blank" rel="noopener noreferrer" title="GitHub">
                            <Github className="w-4 h-4 text-gray-500 hover:text-black" />
                          </a>
                        )}
                        {project.liveUrl && (
                          <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" title="Live URL">
                            <Globe className="w-4 h-4 text-gray-500 hover:text-blue-600" />
                          </a>
                        )}
                        <button
                          onClick={() => router.push(`/dashboard/projects/view/${project.id}`)}
                          title="View Page"
                          className="cursor-pointer"
                        >
                          <Eye className="w-4 h-4 text-gray-500 hover:text-green-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {project.description && (
                    <CardDescription className="line-clamp-2">
                      {project.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Tags */}
                    {project.tags && (
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          const tags = project.tags.split(',').map(tag => tag.trim()).filter(Boolean)
                          const displayTags = tags.slice(0, 3)
                          const remainingCount = tags.length - 3

                          return (
                            <>
                              {displayTags.map((tag, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="text-xs px-1 py-0 bg-gray-100 text-gray-600 hover:bg-gray-200"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {remainingCount > 0 && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs px-1 py-0 bg-gray-100 text-gray-600 hover:bg-gray-200"
                                >
                                  +{remainingCount} more
                                </Badge>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    )}

                    {/* Tech Stack */}
                    {project.techStack && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Code className="h-4 w-4" />
                        <span>{project.techStack}</span>
                      </div>
                    )}

                    {/* Version, Update Date, and Platform */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        {project.version && (
                          <div className="text-xs text-gray-500">
                            v{project.version}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          Updated {formatDate(project.updatedAt)}
                        </div>
                      </div>

                      {/* Platform badges */}
                      {project.platform && (
                        <div className="flex flex-wrap gap-1">
                          {(() => {
                            const platforms = project.platform.split(',').map(p => p.trim()).filter(Boolean)
                            const displayPlatforms = platforms.slice(0, 2)
                            const remainingCount = platforms.length - 2

                            return (
                              <>
                                {displayPlatforms.map((platform, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs px-1 py-0 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                  >
                                    {platform}
                                  </Badge>
                                ))}
                                {remainingCount > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs px-1 py-0 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                  >
                                    +{remainingCount}
                                  </Badge>
                                )}
                              </>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

    </div>
  )
} 