'use client'

import { useRouter } from 'next/navigation'
import { PlusIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useDebounce } from 'use-debounce'
import { getSJList, SJItem } from '@/api/sjplant/sjplantlist'

export default function SJAntarPlant() {
    const router = useRouter()
    const TAKE = 50
    const [data, setData] = useState<SJItem[]>([])

    // Search & Debounce
    const [textInput, setTextInput] = useState("")
    const [searchTerm] = useDebounce(textInput, 500) // Delay 500ms

    // Filter Status
    const [statusFilter, setStatusFilter] = useState<string>('Open')

    // Infinite Scroll State
    const [skip, setSkip] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    // Observer Ref
    const observer = useRef<IntersectionObserver | null>(null)

    // RESET saat Search / Filter berubah
    useEffect(() => {
        setData([])
        setSkip(0)
        setHasMore(true)
    }, [searchTerm, statusFilter])

    // FETCH DATA FUNCTION
    const fetchData = useCallback(async (currentSkip: number, currentSearch: string, currentStatus: string) => {
        setIsLoading(true)
        setError("")

        try {
            // Tentukan status yang dikirim ke API
            let statusesToSend: string[] = []
            if (currentStatus !== 'All') {
                statusesToSend = [currentStatus]
            } else {
                // Jika All, kirim array kosong agar API mengambil semua (Open, Shipped, Received)
                statusesToSend = []
            }

            const result = await getSJList(
                currentSkip,
                TAKE,
                currentSearch,
                statusesToSend
            )

            if (result.success) {
                setData(prev => {
                    // Jika skip 0 (awal/reset), timpa data
                    if (currentSkip === 0) return result.data

                    // Jika scroll, gabungkan data unik
                    const newItems = result.data.filter(
                        newItem => !prev.some(existing => existing.id === newItem.id)
                    )
                    return [...prev, ...newItems]
                })

                // Cek apakah data sudah habis
                if (result.data.length < TAKE) {
                    setHasMore(false)
                }
            } else {
                setError(result.message || "Gagal mengambil data")
            }
        } catch (err) {
            setError("Terjadi kesalahan koneksi.")
        } finally {
            setIsLoading(false)
        }
    }, [])

    // TRIGGER FETCH
    useEffect(() => {
        fetchData(skip, searchTerm, statusFilter)
    }, [skip, searchTerm, statusFilter, fetchData])

    // INFINITE SCROLL OBSERVER
    const lastElementRef = useCallback((node: HTMLTableRowElement) => {
        if (isLoading) return
        if (observer.current) observer.current.disconnect()

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setSkip(prevSkip => prevSkip + TAKE)
            }
        })

        if (node) observer.current.observe(node)
    }, [isLoading, hasMore])

    // Helper Badge Warna
    const getStatusBadge = (status: string) => {
        const s = status.toLowerCase()
        if (s === 'shipped') return 'bg-blue-100 text-blue-700 border-blue-200'
        if (s === 'received') return 'bg-green-100 text-green-700 border-green-200'
        return 'bg-yellow-100 text-yellow-700 border-yellow-200' // Open
    }

    return (
        <div className="space-y-4">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-gray-800 tracking-tight">SJ Antar Plant</h2>
                <button
                    onClick={() => router.push('/sjantarplant/entry')}
                    className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors w-full sm:w-auto"
                >
                    <PlusIcon className="h-5 w-5" />
                    <span>Add New</span>
                </button>
            </div>

            {/* FILTERS */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* STATUS DROPDOWN */}
                <div className="relative w-full sm:w-40">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full appearance-none rounded-md border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm"
                    >
                        <option value="All">All</option>
                        <option value="Open">Open</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Received">Received</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronDownIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    </div>
                </div>

                {/* SEARCH INPUT */}
                <div className="relative flex-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search Pack Number..."
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        className="block w-full bg-white rounded-md border-0 py-2 pl-9 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
                    />
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto max-h-[70vh]">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">No</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pack Number</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ship Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ship To</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 text-sm text-gray-700">
                            {isLoading && skip === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            {/* Spinner di tengah tabel */}
                                            <div className="animate-spin h-6 w-6 border-2 border-orange-500 rounded-full border-t-transparent mb-2"></div>
                                            <p>Memuat data...</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {data.map((item, index) => {
                                const isLastElement = index === data.length - 1
                                return (
                                    <tr
                                        key={`${item.id}-${index}`}
                                        ref={isLastElement ? lastElementRef : null}
                                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/sjantarplant/entry?id=${item.packNumber}`)}
                                    >
                                        <td className="px-6 py-4 text-center text-gray-500">{index + 1}</td>
                                        <td className="px-6 py-4 font-medium text-blue-600 hover:underline">{item.packNumber}</td>
                                        <td className="px-6 py-4">{item.actualShipDate}</td>
                                        <td className="px-6 py-4">{item.shipTo}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}

                            {isLoading && skip > 0 && (
                                <tr><td colSpan={5} className="py-4 text-center text-gray-500">Memuat data tambahan...</td></tr>
                            )}

                            {!isLoading && data.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-gray-400">
                                        {error ? <span className="text-red-500">{error}</span> : "Data tidak ditemukan."}
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