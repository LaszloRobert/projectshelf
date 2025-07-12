import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name too long'),
  description: z.string().optional(),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'DEPLOYED', 'ARCHIVED', 'ON_HOLD']).default('PLANNING'),
  gitUrl: z.string().url('Invalid Git URL').optional().or(z.literal('')),
  gitBranch: z.string().optional(),
  liveUrl: z.string().url('Invalid live URL').optional().or(z.literal('')),
  domain: z.string().optional(),
  domainProvider: z.string().optional(),
  hostingProvider: z.string().optional(),
  techStack: z.string().optional(),
  version: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
})

export const createProjectSchema = projectSchema
export const updateProjectSchema = projectSchema.partial().extend({
  id: z.string().cuid('Invalid project ID'),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type ProjectFormData = z.infer<typeof projectSchema>
export type UpdateProjectFormData = z.infer<typeof updateProjectSchema> 