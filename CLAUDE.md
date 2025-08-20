# ProjectShelf - Claude AI Development Guide

## Project Overview
ProjectShelf is a self-hosted project management application that helps developers track their projects with statuses, notes, and technical details. Built with Next.js 15, TypeScript, Prisma, and SQLite.

## Tech Stack
- **Framework**: Next.js 15 with App Router and Turbopack
- **Language**: TypeScript 5
- **Database**: SQLite with Prisma ORM
- **UI**: Tailwind CSS 4, Radix UI components, Lucide React icons
- **Authentication**: JWT tokens with bcryptjs password hashing
- **Forms**: React Hook Form with Zod validation
- **Theming**: next-themes with dark/light mode
- **Deployment**: Docker containerization

## Development Commands
```bash
# Development
npm run dev          # Start dev server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npx prisma migrate dev     # Run database migrations
npx prisma generate        # Generate Prisma client
npx prisma studio          # Open database browser
```

## Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── projects/      # Project CRUD operations
│   │   └── admin/         # Admin-only endpoints
│   ├── dashboard/         # Protected dashboard pages
│   ├── login/             # Login page
│   └── layout.tsx         # Root layout with theme providers
├── components/
│   ├── features/          # Feature-specific components
│   ├── layout/            # Layout components (Navbar)
│   ├── theme/             # Theme providers
│   └── ui/                # Reusable UI components (shadcn/ui style)
├── contexts/              # React contexts (UpdateContext)
├── lib/                   # Utility libraries
│   ├── auth.ts            # Authentication utilities
│   ├── db.ts              # Prisma client setup
│   ├── env-setup.ts       # Environment configuration
│   ├── middleware.ts      # Next.js middleware
│   ├── utils.ts           # General utilities (cn, etc.)
│   ├── validations.ts     # Zod schemas
│   └── version.ts         # Version checking utilities
└── types/                 # TypeScript type definitions
```

## Database Schema (Prisma)
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // Hashed with bcryptjs
  name      String?
  isAdmin   Boolean  @default(false)
  projects  Project[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Project {
  id               String        @id @default(cuid())
  name             String
  description      String?
  status           ProjectStatus @default(PLANNING)
  gitUrl           String?
  liveUrl          String?
  domainProvider   String?
  hostingProvider  String?
  techStack        String?       // JSON string
  version          String?
  notes            String?
  lessonLearned    String?
  tags             String?       // Comma-separated
  platform         String?       // Comma-separated
  userId           String
  user             User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
}

enum ProjectStatus {
  PLANNING
  IN_PROGRESS
  COMPLETED
}
```

## Architecture Patterns

### Authentication Flow
- JWT-based authentication with HTTP-only cookies
- Middleware protection for dashboard routes (`src/lib/middleware.ts`)
- Default admin account: `admin@email.com` / `changeme`
- Password hashing with bcryptjs (salt rounds: 12)

### Component Architecture
- **Providers Pattern**: Theme and update context providers in root layout
- **Compound Components**: Modal dialogs with open/close state management
- **Forward Refs**: Navbar component exposes imperative API for modals
- **Custom Hooks**: useUpdate context for update notifications

### API Design
- RESTful API routes in `app/api/`
- JWT token validation middleware
- Admin-only routes protected by `isAdmin` check
- Error handling with proper HTTP status codes

### State Management
- React Context for global state (theme, updates)
- Local component state with useState
- Form state with React Hook Form
- Server state fetched in Server Components where possible

## Key Features

### Project Management
- CRUD operations for projects with rich metadata
- Status tracking (Planning, In Progress, Completed)
- Technology stack tracking, version info, hosting details
- Personal notes and lessons learned

### Multi-User Support
- Admin users can create/manage other users
- User isolation - users only see their own projects
- Admin dashboard for user management

### Theme System
- Dark/light mode toggle with persistence
- next-themes integration with Tailwind CSS
- Theme-aware icons and styling

### Update Notifications
- Version checking system (`src/lib/version.ts`)
- GitHub releases integration
- Navbar notification dots for available updates

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- ESLint with Next.js rules (core-web-vitals, typescript)
- Tailwind CSS for styling with design system patterns
- Path aliases: `@/*` maps to `src/*`

### Component Patterns
```typescript
// Use forwardRef for components that need imperative APIs
const Component = forwardRef<ComponentRef, ComponentProps>((props, ref) => {
  useImperativeHandle(ref, () => ({
    // exposed methods
  }))
  return <div>...</div>
})

// Use Zod for form validation
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})
```

### Database Operations
- Use Prisma client from `src/lib/db.ts`
- Prefer server actions or API routes for mutations
- Include proper error handling and type safety

### Security Practices
- Environment variables auto-generated on startup
- JWT secrets generated securely
- Passwords hashed with bcryptjs
- Input validation with Zod schemas
- SQL injection protection via Prisma

## Testing
- No formal testing framework configured
- Manual testing recommended for features
- Use TypeScript for compile-time validation
- Database migrations tested via Prisma

## Docker Deployment
```dockerfile
# Multi-stage build with Node.js 18 Alpine
# Database volume: /app/data
# Exposed port: 8080
```

## Environment Configuration
- Auto-generated `.env` file on first startup
- `JWT_SECRET`: Auto-generated secure random string
- `DATABASE_URL`: Default to `file:./data/projectshelf.db`

## Common Tasks

### Adding New Components
1. Create in appropriate `components/` subdirectory
2. Follow existing patterns (forwardRef, TypeScript interfaces)
3. Use Tailwind classes for styling
4. Import from `@/components/...`

### Database Changes
1. Modify `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name description`
3. Update TypeScript types if needed
4. Test migration on development database

### Adding API Routes
1. Create in `app/api/` following REST conventions
2. Add authentication checks if needed
3. Use Zod for request validation
4. Return proper HTTP status codes

### Update Checks
- Version checking implemented in `src/lib/version.ts`
- Uses GitHub API to check for new releases
- Admin users see update notifications in settings

## Known Issues & Limitations
- ESLint ignored during builds (`next.config.ts`)
- No automated testing framework
- Single SQLite database (not distributed)
- JWT tokens in localStorage (consider HTTP-only cookies)

## Security Notes
- Change default admin password after setup
- Use HTTPS in production
- Regular database backups recommended
- JWT secret rotation strategy needed for production