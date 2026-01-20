'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { logoutAction } from '../api/auth/logout'
import { useSidebar } from '../context/SidebarContext'
import {
    UserCircleIcon,
    ArrowRightStartOnRectangleIcon,
    XMarkIcon
} from '@heroicons/react/24/outline'
import logoImage from '../../public/assets/logo.png'
import { MENU_ITEMS } from '../constants/navigation'

type SidebarProps = {
    userId: string
}

export default function Sidebar({ userId }: SidebarProps) {
    const pathname = usePathname()
    const { isOpen, close } = useSidebar()

    return (
        <>
            {/* Backdrop (Mobile) */}
            <div
                className={`fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity duration-300 ${
                    isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}
                onClick={close}
            />

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-screen w-64 bg-[#242424] text-[#E5E5E5]
                flex flex-col justify-between z-50 transition-transform duration-300
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div>
                    {/* Header */}
                    <div className="h-20 flex items-center justify-between px-6 border-b border-[#3F3F3F]">
                        <div className="flex items-center">
                            {/* Logo TANPA background */}
                            <div className="relative h-10 w-10 mr-3 shrink-0">
                                <Image
                                    src={logoImage}
                                    alt="Logo"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>

                            <span className="font-semibold text-sm tracking-wide text-[#E5E5E5]">
                                PT Sparta Guna Sentosa
                            </span>
                        </div>

                        <button
                            onClick={close}
                            className="lg:hidden text-[#A3A3A3] hover:text-white"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Menu */}
                    <nav className="mt-6 px-3 space-y-2">
                        {MENU_ITEMS.map((item) => {
                            const isActive = item.match 
                                ? item.match(pathname) 
                                : pathname === item.href

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center px-4 py-3 rounded-lg
                                    transition-colors duration-200
                                    ${
                                        isActive
                                            ? 'bg-[#E67E22] text-white'
                                            : 'text-[#E5E5E5] hover:bg-[#F7931E] hover:text-white'
                                    }`}
                                >
                                    <item.icon className="h-6 w-6 mr-3 shrink-0" />
                                    <span className="font-medium text-sm">
                                        {item.name}
                                    </span>
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#3F3F3F] bg-[#1F1F1F]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <UserCircleIcon className="h-9 w-9 text-[#A3A3A3]" />
                            <div className="overflow-hidden">
                                <p className="text-xs text-[#A3A3A3]">
                                    Login as
                                </p>
                                <p
                                    className="text-sm font-semibold text-white truncate"
                                    title={userId}
                                >
                                    {userId}
                                </p>
                            </div>
                        </div>

                        {/* Logout button ORANGE on hover */}
                        <button
                            onClick={() => logoutAction()}
                            className="p-2 rounded-md text-[#A3A3A3]
                            hover:text-white hover:bg-[#F7931E] transition"
                            title="Logout"
                        >
                            <ArrowRightStartOnRectangleIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    )
}
