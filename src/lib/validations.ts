import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name too long'),
  description: z.string().optional(),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'COMPLETED']).default('PLANNING'),
  gitUrl: z.string().url('Invalid Git URL').optional().or(z.literal('')),
  liveUrl: z.string().url('Invalid live URL').optional().or(z.literal('')),
  domainProvider: z.string().optional(),
  hostingProvider: z.string().optional(),
  techStack: z.string().optional(),
  version: z.string().optional(),
  lessonLearned: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
  platform: z.string().optional(),
})

export const createProjectSchema = projectSchema
export const updateProjectSchema = projectSchema.partial().extend({
  id: z.string().cuid('Invalid project ID'),
})

export const updateProfileSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  email: z.string().email('Invalid email address').optional(),
  newPassword: z.preprocess(
    (val) => val === '' ? undefined : val,
    z.string().min(6, 'Password must be at least 6 characters').optional()
  ),
}).refine(
  (data) => data.email || data.newPassword,
  { message: 'Either email or new password must be provided', path: ['email'] }
)

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  isAdmin: z.boolean().default(false),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type ProjectFormData = z.infer<typeof projectSchema>
export type UpdateProjectFormData = z.infer<typeof updateProjectSchema>
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>
export type CreateUserFormData = z.infer<typeof createUserSchema> 