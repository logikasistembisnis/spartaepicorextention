'use client'

import { useState, useRef } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'

interface ScanInputProps {
    onScan: (rawValue: string) => void
    disabled?: boolean
}

export default function ScanInput({ onScan, disabled }: ScanInputProps) {
    const [val, setVal] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!val.trim()) return

        onScan(val)
        setVal('')
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">
                Hitung Melalui QR Code
            </label>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    disabled={disabled}
                    className="flex-1 rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm"
                    placeholder="Scan QR di sini..."
                    autoComplete="off"
                />
                <button
                    type="submit"
                    disabled={!val || disabled}
                    className="inline-flex items-center px-4 py-2 text-sm rounded-md text-white bg-blue-600 disabled:bg-gray-400"
                >
                    <PlusIcon className="h-5 w-5 mr-1" />
                    Tambah
                </button>
            </form>
        </div>
    )
}
