'use client'

import { useRouter } from 'next/navigation'
import { MagnifyingGlassIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useDebounce } from 'use-debounce'
import { getSJList, SJItem } from '@/api/sjplant/sjplantlist';

export default function RcvAntarPlant() {
    const router = useRouter()
    const TAKE = 50
    const [data, setData] = useState<SJItem[]>([])

    // Search
    const [textInput, setTextInput] = useState("")
    const [searchTerm] = useDebounce(textInput, 500)

    // Filter 
    const [statusFilter, setStatusFilter] = useState<string>('Shipped')

    // Infinite Scroll
    const [skip, setSkip] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const observer = useRef<IntersectionObserver | null>(null)

    // Reset saat Search / Filter berubah
    useEffect(() => {
        setData([]);
        setSkip(0);
        setHasMore(true);
    }, [searchTerm, statusFilter]);

    // Fetch Data
    const fetchData = useCallback(async (currentSkip: number, currentSearch: string, currentStatusFilter: string) => {
        setIsLoading(true);
        setError("");

        try {
            let statusesToSend: string[] = [];

            if (currentStatusFilter === 'All') {
                statusesToSend = ['Shipped', 'Received'];
            } else {
                statusesToSend = [currentStatusFilter];
            }

            const result = await getSJList(
                currentSkip,
                TAKE,
                currentSearch,
                statusesToSend
            );

            if (result.success) {
                setData(prev => {
                    if (currentSkip === 0) return result.data;
                    const newItems = result.data.filter(
                        newItem => !prev.some(existing => existing.id === newItem.id)
                    );
                    return [...prev, ...newItems];
                });

                if (result.data.length < TAKE) {
                    setHasMore(false);
                }
            } else {
                setError(result.message || "Gagal load data");
            }
        } catch (err) {
            setError("Kesalahan koneksi.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Trigger Fetch
    useEffect(() => {
        fetchData(skip, searchTerm, statusFilter);
    }, [skip, searchTerm, statusFilter, fetchData]);


    // Observer Scroll
    const lastElementRef = useCallback((node: HTMLTableRowElement) => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setSkip(prevSkip => prevSkip + TAKE);
            }
        });

        if (node) observer.current.observe(node);
    }, [isLoading, hasMore]);

    const getStatusBadge = (status: string) => {
        const s = status.toLowerCase()
        if (s === 'shipped') return 'bg-blue-100 text-blue-700 border-blue-200'
        if (s === 'received') return 'bg-green-100 text-green-700 border-green-200'
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 tracking-tight">Receipt Antar Plant</h2>

            {/* FILTER & SEARCH BAR */}
            <div className="flex flex-col sm:flex-row gap-3">

                {/* STATUS FILTER */}
                <div className="relative w-full sm:w-44">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full appearance-none rounded-md border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm"
                    >
                        <option value="All">All</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Received">Received</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronDownIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    </div>
                </div>

                {/* SEARCH */}
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search Pack Number..."
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        className="block w-full bg-white rounded-md border-0 py-2 pl-9 ring-1 ring-inset ring-gray-300 text-sm"
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
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pack Number Plant</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actual Ship Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ship To</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 text-sm text-gray-700">
                            {isLoading && skip === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="animate-spin h-6 w-6 border-2 border-orange-500 rounded-full border-t-transparent mb-2"></div>
                                            <p>Memuat data...</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {data.map((item, index) => {
                                const isLastElement = index === data.length - 1;
                                return (
                                    <tr
                                        key={`${item.id}-${index}`}
                                        ref={isLastElement ? lastElementRef : null}
                                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => router.push(`/receiptplant/entry?id=${item.packNumber}`)}
                                    >
                                        <td className="px-6 py-4 text-center text-gray-500">{index + 1}</td>
                                        <td className="px-6 py-4 font-medium text-blue-600">{item.packNumber}</td>
                                        <td className="px-6 py-4">{item.actualShipDate}</td>
                                        <td className="px-6 py-4">{item.shipTo}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}

                            {isLoading && skip > 0 && (
                                <tr><td colSpan={5} className="py-4 text-center text-gray-500">Sedang memuat data tambahan...</td></tr>
                            )}

                            {!isLoading && data.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-gray-400">
                                        {searchTerm ? "Data tidak ditemukan." : "Belum ada data."}
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