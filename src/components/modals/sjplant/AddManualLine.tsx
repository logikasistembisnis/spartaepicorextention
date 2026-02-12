'use client'

import { useEffect, useState } from 'react'
import { SjPlantLine, WarehouseOption } from '@/types/sjPlant'
import { getPartsList } from '@/api/sjplant/part'
import { MagnifyingGlassIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { getPartWarehouseList } from '@/api/sjplant/whse'
import { useDebounce } from "use-debounce"

type ApiPart = {
    Part_PartNum: string;
    Part_PartDescription: string;
    Part_ClassID: string;
    Part_IUM: string;
    RowIdent: string;
};

interface Props {
    open: boolean
    onClose: () => void
    onAdd: (line: SjPlantLine) => void
    nextLineNum: number
    shipFrom: string
}

export default function AddManualLineModal({ open, onClose, onAdd, nextLineNum, shipFrom }: Props) {
    // --- STATE ---
    const [partList, setPartList] = useState<ApiPart[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [error, setError] = useState<string | null>(null)
    
    // Konfigurasi Pagination
    const TAKE = 50
    const [skip, setSkip] = useState(0)
    const [hasMore, setHasMore] = useState(true)

    // Debounce search agar tidak hit API setiap ketukan
    const [debouncedSearch] = useDebounce(searchQuery, 500)

    // --- RESET STATE SAAT MODAL DITUTUP ---
    useEffect(() => {
        if (!open) {
            setPartList([])
            setSkip(0)
            setSearchQuery('')
            setHasMore(true)
            setIsLoading(false)
        }
    }, [open])

    useEffect(() => {
        if (!open) return
        if (searchQuery !== debouncedSearch) return;

        const loadData = async () => {
            if (skip === 0) {
                setIsLoading(true)
            } else {
                setIsLoadingMore(true)
            }

            setError(null)

            const res = await getPartsList(debouncedSearch, skip, TAKE)

            if (res.success && res.data) {
                setPartList(prev => {
                    if (skip === 0) return res.data ?? []
                    return [...prev, ...(res.data ?? [])]
                })

                // Cek apakah data sudah habis
                if ((res.data?.length || 0) < TAKE) {
                    setHasMore(false)
                } else {
                    setHasMore(true)
                }
            } else {
                setError(res.error || "Gagal memuat data part.")
            }

            setIsLoading(false)
            setIsLoadingMore(false)
        }

        loadData()

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, skip, open]) 

    // --- 2. HANDLE SEARCH INPUT ---
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setSkip(0); 
    };

    // --- 3. PILIH PART ---
    const handleSelectPart = async (part: ApiPart) => {
        setIsLoading(true);
        let whOptions: WarehouseOption[] = [];
        let defaultWh = '';

        if (shipFrom) {
            try {
                const resWh = await getPartWarehouseList(part.Part_PartNum, shipFrom);
                if (resWh.success && resWh.data) {
                    whOptions = resWh.data.map((w) => ({
                        code: w.PartWhse_WarehouseCode,
                        name: w.Warehse_Description
                    }));
                    if (whOptions.length === 1) defaultWh = whOptions[0].code;
                }
            } catch (err) {
                console.error("Gagal fetch warehouse", err);
            }
        }

        const newLine: SjPlantLine = {
            lineNum: nextLineNum,
            partNum: part.Part_PartNum,
            partDesc: part.Part_PartDescription,
            uom: part.Part_IUM,
            availableWarehouses: whOptions,
            warehouseCode: defaultWh,
            binNum: '',
            availableBins: [],
            lotNum: '',
            qty: 0,
            comment: '',
            status: 'OPEN',
            source: 'MANUAL'
        };

        onAdd(newLine);
        onClose();
        setIsLoading(false);
    };

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-gray-900/65 bg-opacity-50 transition-opacity backdrop-blur-sm" onClick={onClose}></div>

            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all w-full sm:my-8 sm:w-full sm:max-w-3xl border border-gray-200">

                    {/* HEADER */}
                    <div className="bg-white px-4 pt-4 pb-3 sm:px-6 sm:pt-5 border-b border-gray-100">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="text-base font-semibold leading-6 text-gray-900">Pilih Part</h3>
                                <p className="text-xs text-gray-500 mt-1">Klik pada baris untuk menambahkan part.</p>
                            </div>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        {/* SEARCH INPUT */}
                        <div className="relative mt-2 mb-2">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                autoFocus
                                type="text"
                                className="block w-full rounded-md border-0 py-2 pl-9 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-sm"
                                placeholder="Cari Part Number / Deskripsi..."
                                value={searchQuery}
                                onChange={handleSearchChange} 
                            />
                        </div>
                    </div>

                    {/* TABLE CONTENT */}
                    <div className="relative h-96 flex flex-col bg-white">
                        
                        {isLoading && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center flex-col gap-2 bg-white bg-opacity-90">
                                <ArrowPathIcon className="h-8 w-8 text-blue-600 animate-spin" />
                                <span className="text-sm text-gray-500">Memuat data part...</span>
                            </div>
                        )}

                        {error && !isLoading && (
                            <div className="flex-1 flex items-center justify-center p-8 text-center text-red-500 text-sm">
                                {error}
                            </div>
                        )}

                        {!isLoading && !error && (
                            <div className="flex-1 overflow-y-auto overflow-x-auto" onScroll={(e) => {
                                const el = e.currentTarget
                                if (
                                    el.scrollTop + el.clientHeight >= el.scrollHeight - 20 &&
                                    hasMore &&
                                    !isLoadingMore &&
                                    !isLoading
                                ) {
                                    setSkip(prev => prev + TAKE)
                                }
                            }}>
                                <table className="min-w-full divide-y divide-gray-200 table-fixed">
                                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider w-1/4">Part Number</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider w-auto">Description</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-900 uppercase tracking-wider w-20">IUM</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {partList.length > 0 ? (
                                            partList.map((part) => (
                                                <tr
                                                    key={part.Part_PartNum}
                                                    onClick={() => handleSelectPart(part)}
                                                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                                                >
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 align-top wrap-break-words">{part.Part_PartNum}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-500 align-top wrap-break-words">{part.Part_PartDescription}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center align-top">
                                                        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                                            {part.Part_IUM}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-10 text-center text-sm text-gray-500">
                                                    Part tidak ditemukan.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    {isLoadingMore && (
                                        <tfoot>
                                            <tr>
                                                <td colSpan={3} className="py-3 text-center text-xs text-gray-400 bg-gray-50">
                                                    <ArrowPathIcon className="inline h-4 w-4 animate-spin mr-2" />
                                                    Memuat data lainnya...
                                                </td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}