'use client'

import { Fragment } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

type EditQtyProps = {
    isOpen: boolean
    onCloseAction: () => void
    onSaveAction: () => void
    partNumber: string
    currentQty: number
    setNewQtyAction: (val: number) => void
    currentQtyCetak: number
    setNewQtyCetakAction: (val: number) => void
    isSaving: boolean
    isPrinted: boolean
}

export default function EditQty({
    isOpen,
    onCloseAction,
    onSaveAction,
    partNumber,
    currentQty,
    setNewQtyAction,
    currentQtyCetak,
    setNewQtyCetakAction,
    isSaving,
    isPrinted
}: EditQtyProps) {

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden transform transition-all">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900">
                        Edit Quantity
                    </h3>
                    <button
                        onClick={onCloseAction}
                        className="text-gray-400 hover:text-gray-500 transition-colors"
                        disabled={isSaving}
                    >
                        <XMarkIcon className="h-4 md:h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">

                    {/* Part Number */}
                    <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                            Part Number
                        </label>
                        <input
                            type="text"
                            value={partNumber}
                            disabled
                            className="w-full rounded-lg border-gray-200 text-gray-500 text-sm md:text-base"
                        />
                    </div>

                    {/* Qty Box | Qty Cetak */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                                Qty Box
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={currentQty}
                                onChange={(e) => setNewQtyAction(Number(e.target.value))}
                                className={`w-full px-4 py-2 rounded-lg border shadow-sm text-sm md:text-base 
                    ${isPrinted
                                        ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed'
                                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900'
                                    }`}
                                disabled={isSaving || isPrinted}
                                autoFocus={!isPrinted}
                            />
                        </div>

                        <div>
                            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                                Qty Cetak
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={currentQtyCetak}
                                onChange={(e) => setNewQtyCetakAction(Number(e.target.value))}
                                className="w-full px-4 py-2 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm text-sm md:text-base text-gray-900"
                                disabled={isSaving}
                                autoFocus={isPrinted}
                            />
                        </div>
                    </div>

                </div>


                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onCloseAction}
                        disabled={isSaving}
                        className="px-3 md:px-4 py-2 text-xs md:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onSaveAction}
                        disabled={isSaving || currentQty <= 0}
                        className="px-3 md:px-4 py-2 text-xs md:text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Menyimpan...
                            </>
                        ) : (
                            'Simpan Perubahan'
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}