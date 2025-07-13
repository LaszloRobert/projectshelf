import { Project } from "./project"

export interface ApiResponse<T> {
    data?: T
    error?: string
    message?: string
  }
  
  export interface ProjectsResponse {
    projects: Project[]
  }