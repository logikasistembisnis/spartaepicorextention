'use client'

import { usePathname } from 'next/navigation'
import { useSidebar } from '../context/SidebarContext'
import { Bars3Icon } from '@heroicons/react/24/outline'

export default function Header() {
  const pathname = usePathname()
  const { toggle, isOpen } = useSidebar()

  const getPageTitle = (path: string) => {
    if (path === '/') return 'Dashboard'
    if (path.startsWith('/qrgeneration')) return 'QR Code Generation'
    return 'Page'
  }

  return (
    <header 
        className={`fixed top-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center px-4 sm:px-8 z-40 shadow-sm transition-all duration-300 ease-in-out ${
            isOpen ? 'left-0 lg:left-64' : 'left-0' 
        }`}
    >
      {/* Tombol Hamburger (Toggle) */}
      <button 
        onClick={toggle} 
        className="mr-4 p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      <h1 className="text-lg md:text-xl font-bold text-gray-800 truncate">
        {getPageTitle(pathname)}
      </h1>
    </header>
  )
}