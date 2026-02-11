'use client'

import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, XMarkIcon, ArrowPathIcon, FunnelIcon, ListBulletIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { getPartsList } from '@/api/qr/part'
import { getPartLots } from '@/api/qr/lot'
import { saveToUD14 } from '@/api/qr/addqrcode'
import { useDebounce } from 'use-debounce'

export type NewPartItem = {
    partNumber: string
    description: string
    lotNumber: string
    qtyBox: number
    qtyCetak: number
    totalBox: number
    qtyPack: number
    custID: string
    custName: string 
}

type ApiPart = {
    Part_PartNum: string
    Part_PartDescription: string
    Part_standartpack_c: number
}

type ApiLot = {
    PartLot_LotNum: string
}

type SelectionData = {
    qtyBox: string
    qtyCetak: string
    selectedLot: string
}

type AddNewProps = {
    customer: {
        custID: string
        custName: string
    }
    onCloseAction: () => void
    onSaveAction: (items: NewPartItem[]) => void
}

export default function AddNew({ customer, onCloseAction, onSaveAction }: AddNewProps) {
    const [partsData, setPartsData] = useState<ApiPart[]>([])
    const [lotsCache, setLotsCache] = useState<Record<string, ApiLot[]>>({})
    const [loadingLots, setLoadingLots] = useState<Record<string, boolean>>({})
    const [loading, setLoading] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [tempSelections, setTempSelections] = useState<Record<string, SelectionData>>({})
    const [showSelectedOnly, setShowSelectedOnly] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearch] = useDebounce(searchQuery, 500)
    const TAKE = 50
    const [skip, setSkip] = useState(0)
    const [hasMore, setHasMore] = useState(true)


    // --- FETCH DATA ---
    useEffect(() => {
        const loadData = async () => {
            if (skip === 0) {
                setLoading(true)       // FULL loading
            } else {
                setLoadingMore(true)   // load more
            }

            setError(null)

            const res = await getPartsList(debouncedSearch, skip, TAKE)

            if (res.success && Array.isArray(res.data)) {
                setPartsData(prev => {
                    if (skip === 0) return res.data ?? []
                    return [...prev, ...(res.data ?? [])]
                })

                if (res.data.length < TAKE) {
                    setHasMore(false)
                }
            } else {
                setError(res.error || "Gagal memuat data")
            }

            setLoading(false)
            setLoadingMore(false)
        }

        loadData()
    }, [debouncedSearch, skip])

    useEffect(() => {
        setPartsData([])
        setSkip(0)
        setHasMore(true)
    }, [debouncedSearch])

    useEffect(() => {
        setPartsData([])
        setSkip(0)
        setHasMore(true)
    }, [])

    // Hitung berapa item yang sudah dipilih
    const selectedCount = Object.keys(tempSelections).length

    const filteredParts = partsData.filter(part => {
        // Cek Pencarian
        const matchesSearch = part.Part_PartNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
            part.Part_PartDescription.toLowerCase().includes(searchQuery.toLowerCase())

        // Cek apakah item ini terpilih
        const isSelected = tempSelections.hasOwnProperty(part.Part_PartNum)

        // Gabungkan logika berdasarkan mode tampilan
        if (showSelectedOnly) {
            // Jika mode "Hanya Terpilih", harus match search DAN harus terpilih
            return matchesSearch && isSelected
        } else {
            // Jika mode "Semua", hanya perlu match search
            return matchesSearch
        }
    })

    const handleCheckboxChange = async (partNum: string, checked: boolean) => {
        if (checked) {
            // 1. Set default state dulu
            setTempSelections(prev => ({
                ...prev,
                [partNum]: { qtyBox: "", qtyCetak: "", selectedLot: "" } // Default Qty Cetak 1
            }))

            // 2. Cek apakah Lot untuk part ini sudah ada di cache?
            if (!lotsCache[partNum]) {
                // Fetch Lots dari API
                setLoadingLots(prev => ({ ...prev, [partNum]: true }))

                const res = await getPartLots(partNum)

                setLoadingLots(prev => ({ ...prev, [partNum]: false }))

                if (res.success && res.data && res.data.length > 0) {
                    // Simpan ke cache
                    setLotsCache(prev => ({ ...prev, [partNum]: res.data! }))

                    // Otomatis pilih Lot pertama
                    setTempSelections(prev => ({
                        ...prev,
                        [partNum]: {
                            ...prev[partNum],
                            selectedLot: res.data![0].PartLot_LotNum
                        }
                    }))
                }
            } else {
                // Jika sudah ada di cache, langsung pakai data cache & pilih lot pertama
                const cachedLots = lotsCache[partNum]
                if (cachedLots.length > 0) {
                    setTempSelections(prev => ({
                        ...prev,
                        [partNum]: {
                            ...prev[partNum],
                            selectedLot: cachedLots[0].PartLot_LotNum
                        }
                    }))
                }
            }
        } else {
            // Uncheck: Hapus dari selection
            setTempSelections(prev => {
                const newState = { ...prev }
                delete newState[partNum]
                return newState
            })
        }
    }

    const handleInputChange = (partNum: string, field: keyof SelectionData, value: string) => {
        setTempSelections(prev => ({
            ...prev,
            [partNum]: {
                ...prev[partNum],
                [field]: value
            }
        }))
    }

    const handleCloseInternal = () => {
        setTempSelections({})
        setSearchQuery('')
        setError(null)
        setShowSelectedOnly(false) // Reset filter tampilan
        setPartsData([])
        setSkip(0)
        setHasMore(true)
        setLoading(false)
        setLoadingMore(false)
        onCloseAction()
    }

    const handleSaveClick = async () => {
        const newItems: NewPartItem[] = []
        let validationError = false;

        partsData.forEach(part => {
            const pNum = part.Part_PartNum
            if (tempSelections.hasOwnProperty(pNum)) {
                const data = tempSelections[pNum]
                const qtyVal = parseInt(data.qtyBox)
                const qtyCetakVal = parseInt(data.qtyCetak)
                const qtyPack = part.Part_standartpack_c || 0
                const totalBox = qtyPack === 0 ? 0 : (qtyVal / qtyPack)

                // Validasi: Qty harus angka, Lot tidak boleh kosong
                if (!data.selectedLot || isNaN(qtyVal) || qtyVal <= 0 || isNaN(qtyCetakVal) || qtyCetakVal <= 0) {
                    validationError = true;
                } else {
                    newItems.push({
                        partNumber: part.Part_PartNum,
                        description: part.Part_PartDescription,
                        lotNumber: data.selectedLot,
                        qtyBox: qtyVal,
                        qtyCetak: qtyCetakVal,
                        qtyPack: qtyPack,
                        totalBox: totalBox,
                        custID: customer.custID,
                        custName: customer.custName,
                    })
                }
            }
        })

        if (newItems.length === 0) {
            alert("Pilih part, pilih lot, masukkan qty box & qty cetak.")
            return
        }

        if (validationError) {
            alert("Harap lengkapi semua data: Lot Number harus dipilih, Qty Box & Qty Cetak harus > 0.")
            return
        }

        setIsSaving(true)
        setError(null)

        try {
            const res = await saveToUD14(newItems)
            if (res.success) {
                onSaveAction(newItems)
                handleCloseInternal()
            } else {
                setError(res.message || "Gagal menyimpan data.")
            }
        } catch (err) {
            setError("Terjadi kesalahan sistem.")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="flex flex-col h-full w-full bg-white">
            {/* Header */}
            <div className="shrink-0 bg-white px-4 py-3 border-b border-gray-100">

                {/* --- TAB NAVIGASI (SEMUA vs TERPILIH) --- */}
                <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 mb-3">
                    <button
                        onClick={() => setShowSelectedOnly(false)}
                        className={`flex-1 flex items-center justify-center text-center gap-2 rounded-md py-1.5 text-sm font-medium transition-all ${!showSelectedOnly
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        <ListBulletIcon className="h-4 w-4 shrink-0" />
                        <span className="leading-none">Semua Part</span>
                    </button>
                    <button
                        onClick={() => setShowSelectedOnly(true)}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-md py-1.5 text-sm font-medium transition-all ${showSelectedOnly
                            ? 'bg-white text-orange-600 shadow-sm ring-1 ring-orange-200'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        <FunnelIcon className="h-4 w-4 shrink-0" />
                        <span className="leading-none flex items-center gap-1">
                            Terpilih
                            <span className="ml-1 rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-700 font-bold">{selectedCount}</span>
                        </span>
                    </button>
                </div>

                {/* Search Input */}
                <div className="relative mt-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full rounded-md border-0 py-2 pl-9 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset text-sm"
                        placeholder={showSelectedOnly ? "Cari di dalam data terpilih..." : "Cari Part Number / Part Deskripsi..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 flex flex-col bg-white overflow-hidden">

                {/* Loading State*/}
                {loading && skip === 0 && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center flex-col gap-2 bg-white bg-opacity-90">
                        <ArrowPathIcon className="h-8 w-8 text-orange-600 animate-spin" />
                        <span className="text-sm text-gray-500">Memuat data...</span>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="flex-1 flex items-center justify-center p-8 text-center text-red-500 text-sm">
                        {error}
                    </div>
                )}

                {/* Table Content*/}
                {!loading && !error && (
                    <div
                        className="flex-1 overflow-y-auto overflow-x-auto"
                        onScroll={(e) => {
                            const el = e.currentTarget
                            if (
                                el.scrollTop + el.clientHeight >= el.scrollHeight - 20 &&
                                hasMore &&
                                !loadingMore &&
                                !loading
                            ) {
                                setSkip(prev => prev + TAKE)
                            }
                        }}
                    >
                        <table className="min-w-full divide-y divide-gray-200 table-fixed">
                            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-3 py-3 text-center w-10 text-xs font-semibold text-gray-900 uppercase">Select</th>
                                    <th className="px-3 py-3 text-left w-20 text-xs font-semibold text-gray-900 uppercase">Part Number</th>
                                    <th className="px-3 py-3 text-left w-20 text-xs font-semibold text-gray-900 uppercase">Part Description</th>
                                    <th className="px-3 py-3 text-center w-20 text-xs font-semibold text-gray-900 uppercase">Lot Number</th>
                                    <th className="px-3 py-3 text-center w-16 text-xs font-semibold text-gray-900 uppercase">Qty Pack</th>
                                    <th className="px-3 py-3 text-center w-16 text-xs font-semibold text-gray-900 uppercase">Qty Box</th>
                                    <th className="px-3 py-3 text-center w-16 text-xs font-semibold text-gray-900 uppercase">Qty Cetak</th>
                                    <th className="px-3 py-3 text-center w-16 text-xs font-semibold text-gray-900 uppercase">Total Box</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredParts.length > 0 ? (
                                    filteredParts.map((part) => {
                                        const pNum = part.Part_PartNum;
                                        const isChecked = tempSelections.hasOwnProperty(pNum);
                                        const selectionData = tempSelections[pNum] || { qtyBox: '', qtyCetak: '', selectedLot: '' };
                                        const isLoadingLot = loadingLots[pNum];
                                        const lots = lotsCache[pNum] || [];
                                        return (
                                            <tr key={pNum} className={isChecked ? "bg-gray-50" : "hover:bg-gray-50"}>
                                                {/* Checkbox */}
                                                <td className="px-3 py-2 text-center align-middle">
                                                    <input type="checkbox"
                                                        className="h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-600 cursor-pointer"
                                                        checked={isChecked}
                                                        onChange={(e) => handleCheckboxChange(pNum, e.target.checked)}
                                                    />
                                                </td>

                                                {/* Part Number */}
                                                <td className="px-3 py-2 align-middle">
                                                    <span className="text-xs md:text-sm text-gray-900 wrap-break-words line-clamp-2">
                                                        {part.Part_PartNum}
                                                    </span>
                                                </td>

                                                {/* Description */}
                                                <td className="px-3 py-2 align-middle">
                                                    <span className="text-xs md:text-sm text-gray-900 wrap-break-words line-clamp-2" title={part.Part_PartDescription}>
                                                        {part.Part_PartDescription}
                                                    </span>
                                                </td>

                                                {/* Lot Number */}
                                                <td className="px-3 py-2 align-middle">
                                                    {isLoadingLot ? (
                                                        <div className="flex items-center justify-center">
                                                            <ArrowPathIcon className="h-3 w-3 animate-spin" />
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="relative">
                                                                <select
                                                                    className={`block w-full appearance-none rounded-md border-0 py-1 pl-2 pr-8 text-xs ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-xs sm:leading-6
                                                                            ${isChecked
                                                                            ? 'text-gray-900 ring-gray-300 focus:ring-gray-600 bg-white cursor-pointer'
                                                                            : 'text-gray-400 ring-gray-200 bg-gray-100 cursor-not-allowed'
                                                                        }`}
                                                                    disabled={!isChecked}
                                                                    value={selectionData.selectedLot}
                                                                    onChange={(e) => handleInputChange(pNum, 'selectedLot', e.target.value)}
                                                                >
                                                                    {/* Placeholder Option */}
                                                                    {!selectionData.selectedLot && <option value=""></option>}

                                                                    {lots.length > 0 ? (
                                                                        lots.map((lot, idx) => (
                                                                            <option key={`${pNum}-${idx}`} value={lot.PartLot_LotNum}>
                                                                                {lot.PartLot_LotNum}
                                                                            </option>
                                                                        ))
                                                                    ) : (
                                                                        <option value="" disabled>No Lot</option>
                                                                    )}
                                                                </select>
                                                                {/* Custom Chevron Icon for Dropdown */}
                                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                                    <ChevronDownIcon className={`h-3 w-3 ${isChecked ? 'text-gray-500' : 'text-gray-300'}`} aria-hidden="true" />
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </td>

                                                <td className="px-3 py-2 text-center align-middle">
                                                    <span className="text-xs text-gray-700 font-medium">
                                                        {part.Part_standartpack_c || 0}
                                                    </span>
                                                </td>

                                                {/* Qty Box */}
                                                <td className="px-3 py-2 align-middle">
                                                    <input type="number" min="1" placeholder="0"
                                                        className={`block w-14 mx-auto rounded-md border-0 py-2 text-center shadow-sm ring-1 ring-inset text-xs text-gray-900 ${isChecked ? 'ring-gray-300 focus:ring-gray-600 bg-white' : 'ring-gray-200 bg-gray-100'}`}
                                                        disabled={!isChecked}
                                                        value={selectionData.qtyBox}
                                                        onChange={(e) => handleInputChange(pNum, 'qtyBox', e.target.value)}
                                                    />
                                                </td>

                                                {/* Qty Cetak */}
                                                <td className="px-3 py-2 align-middle">
                                                    <input type="number" min="1" placeholder="0"
                                                        className={`block w-14 mx-auto rounded-md border-0 py-2 text-center shadow-sm ring-1 ring-inset text-xs text-gray-900 ${isChecked ? 'ring-gray-300 focus:ring-gray-600 bg-white' : 'ring-gray-200 bg-gray-100'}`}
                                                        disabled={!isChecked}
                                                        value={selectionData.qtyCetak}
                                                        onChange={(e) => handleInputChange(pNum, 'qtyCetak', e.target.value)}
                                                    />
                                                </td>

                                                {/* Total Box */}
                                                <td className="px-3 py-2 text-center align-middle">
                                                    <span className="text-xs font-semibold text-gray-700">
                                                        {(() => {
                                                            const qtyBox = parseFloat(selectionData.qtyBox)
                                                            const qtyPack = part.Part_standartpack_c || 0

                                                            if (!isChecked || isNaN(qtyBox)) return "-"
                                                            if (qtyPack === 0) return "0"

                                                            return Math.ceil(qtyBox / qtyPack)
                                                        })()}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-20 text-center text-sm text-gray-500">
                                            {showSelectedOnly ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <FunnelIcon className="h-8 w-8 text-gray-300" />
                                                    <p>Belum ada part yang dipilih.</p>
                                                    <button onClick={() => setShowSelectedOnly(false)} className="text-orange-600 text-xs font-semibold hover:underline">
                                                        Kembali ke Semua Part
                                                    </button>
                                                </div>
                                            ) : (
                                                "Part tidak ditemukan."
                                            )}
                                        </td>
                                    </tr>
                                )}
                                {loadingMore && (
                                    <tr>
                                        <td colSpan={8} className="py-3 text-center text-xs text-gray-400">
                                            <ArrowPathIcon className="inline h-4 w-4 animate-spin mr-2" />
                                            Memuat data lainnya...
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="shrink-0 bg-gray-50 px-4 py-3 border-t border-gray-100 flex justify-end items-center">
                <button type="button" onClick={handleSaveClick} disabled={loading || isSaving || selectedCount === 0}
                    className="inline-flex w-full justify-center rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSaving ? "Menyimpan.." : `Tambah (${selectedCount})`}
                </button>
            </div>
        </div>
    )
}