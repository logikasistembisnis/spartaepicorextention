'use client'

import { useActionState, useEffect, useState } from 'react'
import { loginAction } from '../../api/auth/login'
import { useRouter } from 'next/navigation'

import { UserCircleIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export default function LoginPage() {
    const router = useRouter()

    // useActionState menangani state loading dan hasil dari server action
    // Argument: (action function, initial state)
    const [state, action, isPending] = useActionState(loginAction, { error: '', success: false })

    const [showPassword, setShowPassword] = useState(false);

    // Redirect jika login sukses
    useEffect(() => {
        if (state.success) {
            router.push('/')
        }
    }, [state.success, router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            {/* Card Container */}
            <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                <div className="p-8">
                    <div className="text-center mb-6">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Login</h2>
                        <p className="text-xs md:text-sm text-gray-600 mt-1">Enter your credentials to access the sparta epicor extention</p>
                    </div>

                    {/* Error Alert */}
                    {state.error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                            {state.error}
                        </div>
                    )}

                    {/* Form Login */}
                    <form action={action} className="space-y-6">

                        {/* Input Username */}
                        <div>
                            <label htmlFor="username" className="block text-xs md:text-sm font-bold text-gray-700 mb-1">
                                Username
                            </label>
                            <div className="relative">
                                {/* Icon User di Kiri */}
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserCircleIcon className="h-4 md:h-5 w-5 text-gray-500" aria-hidden="true" />
                                </div>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    required
                                    className="w-full pl-10 pr-4 py-2 border border-gray-400 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-xs md:text-sm text-gray-900"
                                    placeholder="Masukkan username"
                                />
                            </div>
                        </div>

                        {/* Input password */}
                        <div>
                            <label htmlFor="password" className="block text-xs md:text-sm font-bold text-gray-700 mb-1">
                                Password
                            </label>
                            <div className="relative">
                                {/* Icon Gembok di Kiri */}
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LockClosedIcon className="h-4 md:h-5 w-5 text-gray-500" aria-hidden="true" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    required
                                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-xs md:text-sm text-gray-900"
                                    placeholder="••••••••"
                                />
                                {/* Tombol Toggle Mata di Kanan */}
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 outline-none"
                                >
                                    {showPassword ? (
                                        <EyeSlashIcon className="h-4 md:h-5 w-5" aria-hidden="true" />
                                    ) : (
                                        <EyeIcon className="h-4 md:h-5 w-5" aria-hidden="true" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Button Submit */}
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full bg-orange-600 hover:bg-orange-400 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200 disabled:bg-orange-300 disabled:cursor-not-allowed flex justify-center items-center text-sm md:text-base"
                        >
                            {isPending ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                'Login'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}