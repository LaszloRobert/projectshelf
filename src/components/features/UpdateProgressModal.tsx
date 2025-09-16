'use client'

import { useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface UpdateProgressModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetVersion?: string
}

export default function UpdateProgressModal({
  open,
  onOpenChange,
  targetVersion
}: UpdateProgressModalProps) {

  // Auto-close after 30 seconds and refresh the page
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        window.location.reload()
      }, 30000)

      return () => clearTimeout(timer)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            Updating ProjectShelf
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Updating to {targetVersion}...
            </h3>
            <p className="text-muted-foreground mb-4">
              The update will complete in about 30 seconds.
              This page will refresh automatically when ready.
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Please wait...</strong> The application is downloading updates,
              applying changes, and will restart automatically.
              Do not close this dialog or refresh the page.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}