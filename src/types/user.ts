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