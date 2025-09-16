'use client'

import { useState, forwardRef, useImperativeHandle } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, LogOut, FolderOpen, Settings, Moon, Sun, Menu, X } from 'lucide-react'
import CreateProjectModal from '@/components/features/CreateProjectModal'
import { useTheme } from 'next-themes'
import { useUpdate } from '@/contexts/UpdateContext'
import { logoutUser } from '@/lib/auth/client'

interface NavbarProps {
  onProjectCreated?: () => void
}

export interface NavbarRef {
  openCreateModal: () => void
}

const Navbar = forwardRef<NavbarRef, NavbarProps>(({ onProjectCreated }, ref) => {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { showNavbarDot, dismissNavbarDot } = useUpdate()

  useImperativeHandle(ref, () => ({
    openCreateModal: () => setCreateModalOpen(true)
  }))

  const handleLogout = async () => {
    try {
      await logoutUser()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleProjectCreated = () => {
    setCreateModalOpen(false)
    onProjectCreated?.()
  }

  const handleSettingsClick = () => {
    if (showNavbarDot) {
      dismissNavbarDot()
    }
    router.push('/dashboard/settings')
  }

  const isDark = (resolvedTheme ?? theme) === 'dark'

  return (
    <>
      <header className="bg-white shadow-sm border-b border-border dark:bg-card/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => router.push('/dashboard')}>
              <FolderOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-foreground">Project Shelf</h1>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
              <Button onClick={() => setCreateModalOpen(true)} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span className="hidden lg:inline">New Project</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                aria-label="Toggle theme"
                className="flex items-center space-x-2"
                title={isDark ? 'Switch to Light' : 'Switch to Dark'}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span className="hidden lg:inline">{isDark ? 'Light' : 'Dark'}</span>
              </Button>

              <Button
                variant="outline"
                onClick={handleSettingsClick}
                className="flex items-center space-x-2 relative"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden lg:inline">Settings</span>
                {showNavbarDot && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                )}
              </Button>
              <Button variant="outline" onClick={handleLogout} className="flex items-center space-x-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:inline">Logout</span>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="outline"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle mobile menu"
                className="p-2"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border mt-2 pt-2 pb-3 space-y-2">
              <Button
                onClick={() => {
                  setCreateModalOpen(true)
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center justify-start space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>New Project</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setTheme(isDark ? 'light' : 'dark')
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center justify-start space-x-2"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  handleSettingsClick()
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center justify-start space-x-2 relative"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
                {showNavbarDot && (
                  <span className="absolute left-8 top-2 h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  handleLogout()
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center justify-start space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          )}
        </div>
      </header>

      <CreateProjectModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onProjectCreated={handleProjectCreated}
      />
    </>
  )
})

Navbar.displayName = 'Navbar'

export default Navbar