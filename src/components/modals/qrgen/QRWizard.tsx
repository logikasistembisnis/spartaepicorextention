'use client'

import { useState } from 'react'
import SelectCustomer from './SelectCustomer'
import AddNew, { NewPartItem } from './SelectPart'
import { CustomerItem } from '@/types/qr'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface QrWizardProps {
    isOpen: boolean
    onCloseAction: () => void
    onSaveAction: (items: NewPartItem[]) => void
}

export default function QrWizard({
    isOpen,
    onCloseAction,
    onSaveAction
}: QrWizardProps) {
    const [step, setStep] = useState<1 | 2>(1)
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null)

    if (!isOpen) return null

    const handleCustomerSelect = (customer: CustomerItem) => {
        setSelectedCustomer(customer)
        setStep(2)
    }

    const handleBack = () => {
        setStep(1)
        setSelectedCustomer(null)
    }

    const resetWizard = () => {
        setStep(1)
        setSelectedCustomer(null)
    }

    const handleClose = () => {
        resetWizard()
        onCloseAction()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={handleClose}
            />
            <div className="relative w-full max-w-5xl h-[85vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="shrink-0 px-6 py-3 border-gray-100 flex items-center justify-between bg-white z-10">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            {step === 1 ? 'Pilih Customer' : 'Select Part to Generate'}
                        </h3>
                        <p className="text-sm text-gray-600">
                            {step === 1 && 'Klik salah satu baris customer di list untuk melanjutkan'}
                            {step === 2 && 'Pilih part, lalu isi Lot dan Qty sebelum menyimpan'}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {step === 2 && (
                            <div className="text-right mr-4">
                                <p className="text-xs text-gray-400">Customer Selected:</p>
                                <p className="text-sm font-medium text-gray-900">{selectedCustomer?.custName}</p>
                                <button
                                    onClick={handleBack}
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    (Ganti)
                                </button>
                            </div>
                        )}
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden relative bg-gray-50">
                    {step === 1 && (
                        <SelectCustomer
                            onSelect={handleCustomerSelect}
                        />
                    )}

                    {step === 2 && selectedCustomer && (
                        <AddNew
                            customer={selectedCustomer}
                            onCloseAction={handleClose}
                            onSaveAction={(items) => {
                                onSaveAction(items)
                                handleClose()
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}