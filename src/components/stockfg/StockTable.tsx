'use client'

import { useEffect, useState, useMemo } from 'react'
import { getStockData, StockItem } from '@/api/stokfg/getStock'
import { ArrowPathIcon, ExclamationCircleIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useDebounce } from "use-debounce"

type Props = {
    warehouse: string;
    period: string;
    selectedPartNum: string;
    onSelectPart: (partNum: string) => void;
}

export default function StockTable({ warehouse, period, selectedPartNum, onSelectPart }: Props) {
    const [stockList, setStockList] = useState<StockItem[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [error, setError] = useState<string | null>(null)

    // Konfigurasi Pagination
    const TAKE = 50
    const [skip, setSkip] = useState(0)
    const [hasMore, setHasMore] = useState(true)

    // Debounce search (500ms)
    const [debouncedSearch] = useDebounce(searchQuery, 500)

    const formatNumber = (num: number | null | undefined) => {
        const value = num ?? 0;
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    // --- EFFECT 1: RESET SAAT PERIODE/GUDANG BERUBAH ---
    useEffect(() => {
        setStockList([])
        setSkip(0)
        setSearchQuery('')
        setHasMore(true)
        setIsLoading(false)
        setError(null)
    }, [warehouse, period])

    // --- EFFECT 2: FETCH DATA ---
    useEffect(() => {
        if (!warehouse || !period) return;
        if (searchQuery !== debouncedSearch) return;

        const loadData = async () => {
            if (skip === 0) {
                setIsLoading(true)
            } else {
                setIsLoadingMore(true)
            }

            if (skip === 0) setError(null);

            const res = await getStockData(period, debouncedSearch, skip, TAKE)

            if (res.success && res.data) {
                setStockList(prev => {
                    const newData = res.data ?? [];
                    if (skip === 0) return newData;

                    // Filter duplikat untuk keamanan
                    const existingIds = new Set(prev.map(p => p.Calculated_PartNum));
                    const uniqueNewData = newData.filter(item => !existingIds.has(item.Calculated_PartNum));

                    return [...prev, ...uniqueNewData];
                })

                if (skip === 0 && res.data.length > 0 && !selectedPartNum) {
                    onSelectPart(res.data[0].Calculated_PartNum);
                }

                if ((res.data?.length || 0) < TAKE) {
                    setHasMore(false)
                } else {
                    setHasMore(true)
                }
            } else {
                if (skip === 0) setError(res.error || "Gagal memuat data stok.")
            }

            setIsLoading(false)
            setIsLoadingMore(false)
        }

        loadData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, skip, period, warehouse])

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setSkip(0);
        setHasMore(true);
    };

    // --- HANDLE SCROLL (FIXED) ---
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget
        // Buffer 50px sebelum mentok bawah
        if (
            el.scrollTop + el.clientHeight >= el.scrollHeight - 50 &&
            hasMore &&
            !isLoadingMore &&
            !isLoading
        ) {
            setSkip(prev => prev + TAKE)
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full relative flex flex-col h-full">
            {/* --- HEADER SEARCH --- */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-center shrink-0 gap-4">
                <h2 className="text-lg font-semibold text-gray-800 whitespace-nowrap">
                    Gudang Finish Good Stock
                </h2>
                <div className="relative w-full sm:w-64 md:w-80">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 sm:text-sm transition duration-150 ease-in-out"
                        placeholder="Cari Part Number / Desc..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => { setSearchQuery(''); setSkip(0); }}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* --- CONTENT AREA --- */}
            <div className="flex-1 relative overflow-hidden flex flex-col">
                {isLoading && (
                    <div className="absolute inset-0 z-50 bg-white/80 flex flex-col items-center justify-center text-gray-400 backdrop-blur-[1px]">
                        <ArrowPathIcon className="h-10 w-10 animate-spin mb-3 text-orange-500" />
                        <p className="font-medium text-gray-500">Memuat data stok...</p>
                    </div>
                )}

                {error && !isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-red-500 px-4 text-center">
                        <ExclamationCircleIcon className="h-10 w-10 mb-2" />
                        <p className="font-medium">{error}</p>
                        <button onClick={() => setSkip(0)} className="mt-4 text-sm underline hover:text-red-700">Coba Lagi</button>
                    </div>
                ) : (
                    <div
                        className="overflow-auto min-h-80 max-h-80 w-full"
                        onScroll={handleScroll}
                    >
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap w-50">PartNum</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap w-70">Description</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap w-25">Saldo Awal</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap w-25">Mutasi In</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap w-25">Mutasi Out</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap w-25">Saldo Akhir</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">IUM</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Class ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap w-50">Description</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {stockList.length > 0 ? (
                                    stockList.map((item, idx) => {
                                        const isSelected = item.Calculated_PartNum === selectedPartNum;
                                        return (
                                            <tr
                                                key={`${item.Calculated_PartNum}-${idx}`}
                                                onClick={() => onSelectPart(item.Calculated_PartNum)}
                                                className={`transition-colors cursor-pointer ${isSelected
                                                    ? 'bg-blue-50 hover:bg-blue-100 border-l-4 border-l-blue-500'
                                                    : 'hover:bg-gray-50'
                                                    }`}
                                            >
                                                <td className="px-6 py-3 text-sm font-medium text-gray-600 max-w-50 truncate" title={item.Calculated_PartNum}>
                                                    {item.Calculated_PartNum}
                                                </td>
                                                <td className="px-6 py-3 text-sm text-gray-600 max-w-70 truncate" title={item.Part_PartDescription}>
                                                    {item.Part_PartDescription}
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                                                    {formatNumber(item.Calculated_SaldoAwal)}
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                                                    {item.Calculated_MutasiIn !== 0 ? formatNumber(item.Calculated_MutasiIn) : '-'}
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                                                    {item.Calculated_MutasiOut !== 0 ? formatNumber(item.Calculated_MutasiOut) : '-'}
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-gray-600 font-medium">
                                                    {formatNumber(item.Calculated_SaldoAkhir)}
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                                                    {item.Part_IUM}
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                                                    {item.Part_ClassID}
                                                </td>
                                                <td className="px-6 py-3 text-sm text-gray-600 max-w-50 truncate">
                                                    {item.PartClass_Description}
                                                </td>
                                            </tr>
                                        )
                                    })
                                ) : (
                                    !isLoading && (
                                        <tr>
                                            <td colSpan={9} className="px-6 py-12 text-center text-gray-400 italic">
                                                {searchQuery
                                                    ? `Tidak ditemukan data untuk "${searchQuery}"`
                                                    : `Tidak ada data stok untuk periode ${period}`
                                                }
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                            {isLoadingMore && (
                                <tfoot>
                                    <tr>
                                        <td colSpan={9} className="py-3 text-center bg-gray-50 border-t border-gray-100">
                                            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-medium">
                                                <ArrowPathIcon className="h-4 w-4 animate-spin text-orange-500" />
                                                <span>Memuat data lainnya...</span>
                                            </div>
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}