export interface Project {
    id: string
    name: string
    description?: string
    status: ProjectStatus
    gitUrl?: string
    liveUrl?: string
    domainProvider?: string
    hostingProvider?: string
    techStack?: string
    version?: string
    notes?: string
    lessonLearned?: string
    tags?: string
    platform?: string
    userId: string
    createdAt: string
    updatedAt: string
  }
  
  export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED'
  
  export interface CreateProjectData {
    name: string
    description?: string
    status: ProjectStatus
    gitUrl?: string
    liveUrl?: string
    domainProvider?: string
    hostingProvider?: string
    techStack?: string
    version?: string
    notes?: string
    lessonLearned?: string
    tags?: string
    platform?: string
  }

  export type UpdateProjectData = Partial<CreateProjectData>