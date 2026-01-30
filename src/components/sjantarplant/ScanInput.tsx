'use client'
import { useState, useRef, useEffect } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'

interface ScanInputProps {
    onScan: (rawValue: string) => void;
    disabled?: boolean;
}

export default function ScanInput({ onScan, disabled }: ScanInputProps) {
    const [val, setVal] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!val.trim()) return;

        // 1. Kirim data mentah ke parent
        onScan(val);

        // 2. Clear textbox agar siap scan berikutnya
        setVal('');
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">Hasil Scan QR Code</label>
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    disabled={disabled}
                    className="flex-1 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2"
                    placeholder="Input hasil scan barcode di sini..."
                    autoComplete="off"
                />
                <button
                    type="submit"
                    disabled={!val}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                    <PlusIcon className="h-5 w-5 mr-1" />
                    Tambah
                </button>
            </form>
        </div>
    )
}