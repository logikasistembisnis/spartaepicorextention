'use client'

import { useRouter } from 'next/navigation'
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useEffect, useState, useCallback, useRef } from 'react'
import { getRcvPlantList, RcvPlantItem } from '@/api/rcvplant/rcvplantlist'
import { useDebounce } from 'use-debounce'

export default function RcvAntarPlant() {
    const router = useRouter()
    const TAKE = 50
    const [data, setData] = useState<RcvPlantItem[]>([])
    const [textInput, setTextInput] = useState("")
    const [searchTerm] = useDebounce(textInput, 500)
    const [skip, setSkip] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    // Observer untuk Infinite Scroll
    const observer = useRef<IntersectionObserver | null>(null)

    // RESET saat user mengetik (Search berubah)
    useEffect(() => {
        // Reset list jadi kosong supaya hasil search baru bersih
        setData([]);
        setSkip(0);
        setHasMore(true);
    }, [searchTerm]);

    // FETCH DATA UTAMA
    const fetchData = useCallback(async (currentSkip: number, currentSearch: string) => {
        setIsLoading(true);
        setError("");

        try {
            // Panggil API dengan parameter search (bisa kosong stringnya)
            const result = await getRcvPlantList(currentSkip, TAKE, currentSearch);

            if (result.success) {
                setData(prev => {
                    // Jika ini load pertama (skip 0), timpa semua data
                    if (currentSkip === 0) return result.data;

                    // Jika infinite scroll (skip > 0), gabungkan data lama + baru
                    // Filter duplicate id untuk jaga-jaga
                    const newItems = result.data.filter(
                        newItem => !prev.some(existing => existing.id === newItem.id)
                    );
                    return [...prev, ...newItems];
                });

                // Jika data yang didapat kurang dari request (50), berarti data habis
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

    // TRIGGER FETCH saat Skip / SearchTerm berubah
    useEffect(() => {
        fetchData(skip, searchTerm);

    }, [skip, searchTerm, fetchData]);


    // SETUP OBSERVER (Deteksi Scroll Mentok Bawah)
    const lastElementRef = useCallback((node: HTMLTableRowElement) => {
        if (isLoading) return;

        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            // Jika elemen terakhir terlihat DAN masih ada data (hasMore)
            if (entries[0].isIntersecting && hasMore) {
                setSkip(prevSkip => prevSkip + TAKE); // Tambah skip, trigger useEffect no. 3
            }
        });

        if (node) observer.current.observe(node);
    }, [isLoading, hasMore]);

    // Helper untuk warna badge status
    // Kita tambahkan .toLowerCase() agar case-insensitive (misal "OPEN" vs "Open")
    const getStatusBadge = (status: string) => {
        const s = status.toLowerCase()
        if (s === 'shipped') return 'bg-blue-100 text-blue-700 border-blue-200'
        if (s === 'received') return 'bg-green-100 text-green-700 border-green-200'

        // Default (OPEN / DRAFT)
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    }

    const filteredData = data.filter(item =>
        item.packNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-4">
            {/* --- HEADER SECTION --- */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-gray-800 tracking-tight">Receipt Antar Plant</h2>
                <div>
                    <button
                        onClick={() => router.push('/receiptplant/entry')}
                        className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors w-full sm:w-auto"
                    >
                        <PlusIcon className="h-5 w-5" />
                        <span>Add New</span>
                    </button>
                </div>
            </div>

            {/* --- SEARCH FILTER --- */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search Pack Number..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="block w-full rounded-md border-0 py-2 pl-9 ring-1 ring-inset ring-gray-300 focus:ring-2 text-sm"
                />
                {/* Spinner saat user ngetik search */}
                {isLoading && skip === 0 && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <div className="animate-spin h-4 w-4 border-2 border-orange-500 rounded-full border-t-transparent"></div>
                    </div>
                )}
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
                            {data.map((item, index) => {
                                // Cek apakah ini baris terakhir?
                                const isLastElement = index === data.length - 1;

                                return (
                                    <tr
                                        key={`${item.id}-${index}`}
                                        // Ref dipasang di elemen terakhir
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

                            {/* Loading More Indicator */}
                            {isLoading && skip > 0 && (
                                <tr>
                                    <td colSpan={5} className="py-4 text-center text-gray-500">
                                        Sedang memuat data tambahan...
                                    </td>
                                </tr>
                            )}

                            {/* Empty State */}
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