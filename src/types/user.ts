export interface User {
    id: string
    email: string
    name?: string
    isAdmin: boolean
    createdAt: string
    updatedAt: string
  }
  
  export interface AuthUser {
    userId: string
    email: string
    isAdmin: boolean
  }

  export interface UserWithProjectCount extends User {
    _count: {
      projects: number
    }
  }

  export interface CreateUserData {
    email: string
    password: string
    name?: string
    isAdmin: boolean
  }