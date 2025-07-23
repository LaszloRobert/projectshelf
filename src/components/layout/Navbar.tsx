'use client'

import { useState, forwardRef, useImperativeHandle } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, LogOut, FolderOpen, Settings } from 'lucide-react'
import CreateProjectModal from '@/components/features/CreateProjectModal'

interface NavbarProps {
  onProjectCreated?: () => void
}

export interface NavbarRef {
  openCreateModal: () => void
}

const Navbar = forwardRef<NavbarRef, NavbarProps>(({ onProjectCreated }, ref) => {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const router = useRouter()

  useImperativeHandle(ref, () => ({
    openCreateModal: () => setCreateModalOpen(true)
  }))

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleProjectCreated = () => {
    setCreateModalOpen(false)
    onProjectCreated?.()
  }

  return (
    <>
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Project Shelf</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => setCreateModalOpen(true)} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>New Project</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard/settings')} 
                className="flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Button>
              <Button variant="outline" onClick={handleLogout} className="flex items-center space-x-2">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
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