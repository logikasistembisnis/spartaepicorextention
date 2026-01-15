'use client'

import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { getPartsList } from '@/api/part'
import { saveToUD14 } from '@/api/addqrcode'

export type NewPartItem = {
    partNumber: string
    description: string
    qtyBox: number
}

type ApiPart = {
    Part_PartNum: string
    Part_PartDescription: string
}

type AddNewProps = {
    isOpen: boolean
    onCloseAction: () => void
    onSaveAction: (items: NewPartItem[]) => void
}

export default function AddNew({ isOpen, onCloseAction, onSaveAction }: AddNewProps) {
    const [partsData, setPartsData] = useState<ApiPart[]>([])
    const [loading, setLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [tempSelections, setTempSelections] = useState<Record<string, string>>({})

    // --- FETCH DATA ---
    useEffect(() => {
        if (isOpen) {
            const loadData = async () => {
                setLoading(true)
                setError(null)
                // Simulasi delay sedikit biar kelihatan loadingnya diam di tengah
                const res = await getPartsList()
                if (res.success && res.data) {
                    setPartsData(res.data)
                } else {
                    setError(res.error || "Gagal memuat data")
                }
                setLoading(false)
            }
            loadData()
        }
    }, [isOpen])

    // --- LOGIC ---
    const filteredParts = partsData.filter(part =>
        part.Part_PartNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
        part.Part_PartDescription.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleCheckboxChange = (partNum: string, checked: boolean) => {
        setTempSelections(prev => {
            const newState = { ...prev }
            if (checked) newState[partNum] = ""
            else delete newState[partNum]
            return newState
        })
    }

    const handleQtyChange = (partNum: string, value: string) => {
        setTempSelections(prev => ({ ...prev, [partNum]: value }))
    }

    const handleCloseInternal = () => {
        setTempSelections({})
        setSearchQuery('')
        setError(null)
        onCloseAction()
    }

    const handleSaveClick = async () => {
        const newItems: NewPartItem[] = []
        partsData.forEach(part => {
            const pNum = part.Part_PartNum
            if (tempSelections.hasOwnProperty(pNum)) {
                const qtyVal = parseInt(tempSelections[pNum])
                if (!isNaN(qtyVal) && qtyVal > 0) {
                    newItems.push({
                        partNumber: part.Part_PartNum,
                        description: part.Part_PartDescription,
                        qtyBox: qtyVal
                    })
                }
            }
        })

        if (newItems.length === 0) {
            alert("Isi Qty Box!")
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

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-60 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-gray-900/65 bg-opacity-50 transition-opacity backdrop-blur-sm" onClick={handleCloseInternal}></div>

            {/* Container Positioning */}
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                
                <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all w-full sm:my-8 sm:w-full sm:max-w-xl border border-gray-200">

                    {/* Header */}
                    <div className="bg-white px-4 pt-4 pb-3 sm:px-6 sm:pt-5 border-b border-gray-100">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="text-base font-semibold leading-6 text-gray-900">Select Part to Generate</h3>
                                <p className="text-xs text-gray-500 mt-1">Checlist part dan isi Qty Box</p>
                            </div>
                            <button onClick={handleCloseInternal} className="text-gray-400 hover:text-gray-500">
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                        
                        {/* Search Input */}
                        <div className="relative mt-2">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full rounded-md border-0 py-2 pl-9 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset  text-sm"
                                placeholder="Cari Part Number / Part Deskripsi..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="relative h-70 flex flex-col bg-white">
                        
                        {/* Loading State*/}
                        {(loading) && (
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
                            <div className="flex-1 overflow-y-auto overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="px-3 py-3 text-center w-10 text-xs font-semibold text-gray-900 uppercase">Select</th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Part Number</th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Part Description</th>
                                            <th className="px-3 py-3 text-center w-16 text-xs font-semibold text-gray-900 uppercase">Qty Box</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredParts.length > 0 ? (
                                            filteredParts.map((part) => {
                                                const pNum = part.Part_PartNum;
                                                const isChecked = tempSelections.hasOwnProperty(pNum);
                                                return (
                                                    <tr key={pNum} className={isChecked ? "bg-orange-50" : "hover:bg-gray-50"}>
                                                        {/* Checkbox */}
                                                        <td className="px-3 py-2 text-center align-middle">
                                                            <input type="checkbox" 
                                                                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-600 cursor-pointer"
                                                                checked={isChecked} 
                                                                onChange={(e) => handleCheckboxChange(pNum, e.target.checked)} 
                                                            />
                                                        </td>
                                                        
                                                        {/* Part Number */}
                                                        <td className="px-3 py-2 align-middle">
                                                            <span className="text-xs md:text-sm text-gray-900 block min-w-37.5 wrap-break-words line-clamp-2">
                                                                {part.Part_PartNum}
                                                            </span>
                                                        </td>

                                                        {/* Description */}
                                                        <td className="px-3 py-2 align-middle">
                                                            <span className="text-xs md:text-sm text-gray-900 block min-w-37.5 wrap-break-words line-clamp-2" title={part.Part_PartDescription}>
                                                                {part.Part_PartDescription}
                                                            </span>
                                                        </td>

                                                        {/* Qty Box */}
                                                        <td className="px-3 py-2 align-middle">
                                                            <input type="number" min="1" placeholder="0"
                                                                className={`block w-14 mx-auto rounded-md border-0 py-1 text-center shadow-sm ring-1 ring-inset text-xs text-gray-900 ${isChecked ? 'ring-gray-300 focus:ring-gray-600 bg-white' : 'ring-gray-200 bg-gray-100'}`}
                                                                disabled={!isChecked}
                                                                value={isChecked ? tempSelections[pNum] : ''}
                                                                onChange={(e) => handleQtyChange(pNum, e.target.value)}
                                                            />
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-20 text-center text-sm text-gray-500">
                                                    Data tidak ditemukan.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-gray-100 gap-2">
                        <button type="button" onClick={handleSaveClick} disabled={loading || isSaving || Object.keys(tempSelections).length === 0}
                            className="inline-flex w-full justify-center rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 sm:w-auto disabled:opacity-50">
                            {isSaving ? "Menyimpan.." : "Tambah"}
                        </button>
                        <button type="button" onClick={handleCloseInternal}
                            className="mt-2 sm:mt-0 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:w-auto">
                            Batal
                        </button>
                    </div>

                </div>
            </div>
        </div>
    )
}