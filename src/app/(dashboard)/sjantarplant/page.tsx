'use client'

import { useRouter } from 'next/navigation'
import { PlusIcon, TruckIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { getSJList, SJItem } from '@/api/sjplant/sjplantlist'

export default function SJAntarPlant() {
    const router = useRouter()

    // --- STATE MANAGEMENT ---
    const [data, setData] = useState<SJItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")

    // --- FETCH DATA ON MOUNT ---
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            const result = await getSJList()

            if (result.success && result.data) {
                setData(result.data)
            } else {
                setError(result.message || "Terjadi kesalahan")
            }
            setIsLoading(false)
        }

        fetchData()
    }, [])

    // Helper untuk warna badge status
    // Kita tambahkan .toLowerCase() agar case-insensitive (misal "OPEN" vs "Open")
    const getStatusBadge = (status: string) => {
        const s = status.toLowerCase()
        if (s === 'shipped') return 'bg-blue-100 text-blue-700 border-blue-200'
        if (s === 'received') return 'bg-green-100 text-green-700 border-green-200'

        // Default (OPEN / DRAFT)
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    }

    return (
        <div className="space-y-6">
            {/* --- HEADER SECTION --- */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-gray-800 tracking-tight">SJ Antar Plant</h2>
                <div>
                    <button
                        onClick={() => router.push('/sjantarplant/entry')}
                        className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors w-full sm:w-auto"
                    >
                        <PlusIcon className="h-5 w-5" />
                        <span>Add New</span>
                    </button>
                </div>
            </div>

            {/* --- TABLE SECTION --- */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto max-h-[70vh]">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-4 md:px-6 py-2 md:py-4 text-center text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wider">No</th>
                                <th className="px-4 md:px-6 py-2 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wider">Pack Number Plant</th>
                                <th className="px-4 md:px-6 py-2 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wider">Actual Ship Date</th>
                                <th className="px-4 md:px-6 py-2 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wider">Ship To</th>
                                <th className="px-4 md:px-6 py-2 md:py-4 text-center text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 text-sm text-gray-700">
                            {/* LOGIC LOADING */}
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        Loading data...
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-red-500">
                                        {error}
                                    </td>
                                </tr>
                            ) : data.length > 0 ? (
                                data.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/sjantarplant/entry?id=${item.packNumber}`)}
                                    >
                                        <td className="px-6 py-4 text-center text-gray-500">{index + 1}</td>
                                        <td className="px-6 py-4 font-medium text-blue-600 hover:underline">
                                            {item.packNumber}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {item.actualShipDate}
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.shipTo}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                // STATE KOSONG (EMPTY STATE)
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <TruckIcon className="h-8 w-8 text-gray-300" />
                                            <p>Belum ada data SJ Antar Plant.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    )
}