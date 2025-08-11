import { randomBytes } from 'crypto'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const ENV_PATH = resolve(process.cwd(), '.env')

export function ensureEnvFile(): void {
  // If .env already exists, don't touch it
  if (existsSync(ENV_PATH)) {
    return
  }

  console.log('🔧 No .env file found, creating one with defaults...')

  // Generate a secure random JWT secret
  const jwtSecret = randomBytes(32).toString('hex')

  // Create .env content with minimal essentials
  const envContent = `# ProjectShelf Configuration
# Auto-generated on first startup - customize as needed

# Database Configuration
DATABASE_URL="file:./data/projectshelf.db"

# Security - Auto-generated JWT secret
JWT_SECRET="${jwtSecret}"
`

  // Write the .env file
  writeFileSync(ENV_PATH, envContent)
  
  console.log('✅ Created .env file with auto-generated JWT_SECRET')
  console.log('💡 You can customize settings in the .env file if needed')
}