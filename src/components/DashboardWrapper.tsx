'use client'

import { useSidebar } from '../context/SidebarContext'

export default function DashboardWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const { isOpen } = useSidebar()

  return (
    // Main Content yang margin-kirinya berubah dinamis
    <main 
        className={`pt-16 min-h-screen transition-all duration-300 ease-in-out ${
            isOpen ? 'ml-0 lg:ml-64' : 'ml-0'
        }`}
    >
        <div className="p-4  sm:p-8">
            {children}
        </div>
    </main>
  )
}