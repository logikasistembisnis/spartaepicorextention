'use client'

import { SjPlantHeader } from '@/types/sjPlant'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { ApiShip } from '@/api/sjplant/ship'

interface HeaderSectionProps {
    data: SjPlantHeader;
    plantList: ApiShip[];
    onChange: (field: keyof SjPlantHeader, value: string | boolean | number) => void;
    isLocked?: boolean;
}

export default function HeaderSection({ data, plantList, onChange, isLocked }: HeaderSectionProps) {

    // Helper untuk handle change input standar
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            onChange(name as keyof SjPlantHeader, checked);
        } else {
            onChange(name as keyof SjPlantHeader, value);
        }
    };

    const readOnlyClass = "w-full text-sm border border-gray-300 bg-gray-100 text-gray-600 rounded-md px-4 py-2 shadow-sm focus:outline-none cursor-not-allowed";

    // Style untuk field yang BISA Diedit (Putih, kecuali jika isLocked maka jadi abu)
    const inputClass = `w-full text-sm border border-gray-400 rounded-md px-4 py-2 shadow-sm transition-all outline-none 
        ${isLocked ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500'}`;

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-md">
            {/* Title Bar */}
            <div className="mb-6 border-b border-gray-200 pb-3">
                <h3 className="font-bold text-lg text-gray-800">Header</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* KOLOM KIRI (Pack Info) */}
                <div className="space-y-5">
                    {/* Pack Number Plant */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Pack Number Plant</label>
                        <div className="relative">
                            <input
                                type="text"
                                name="packNum"
                                value={data.packNum}
                                readOnly
                                className={readOnlyClass}
                            />
                        </div>
                    </div>

                    {/* Ship To */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Receive Plant</label>
                        <div className="relative">
                            <input
                                type="text"
                                name="shipTo"
                                value={data.shipTo}
                                readOnly
                                className={readOnlyClass}
                            />
                        </div>
                    </div>

                    {/* Receipt Date */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Receipt Date</label>
                        <input
                            type="date"
                            name="receiptDate"
                            value={data.receiptDate}
                            onChange={handleChange}
                            disabled={isLocked}
                            className={inputClass}
                        />
                    </div>

                    {/* Received Checkbox */}
                    <div className="flex items-center gap-3 mb-4">
                        <input
                            type="checkbox"
                            name="isReceived"
                            checked={data.isReceived}
                            onChange={handleChange}
                            id="rcvCheck"
                            className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <label htmlFor="rcvCheck" className="text-sm font-medium text-gray-700 cursor-pointer select-none">Received All</label>
                    </div>

                    {/* Receipt Comment */}
                    <div className="mt-4">
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Receipt Comment</label>
                        <textarea
                            name="rcvComment"
                            value={data.rcvComment}
                            onChange={handleChange}
                            disabled={isLocked}
                            rows={3}
                            className={inputClass}
                            placeholder="Type any additional notes here..."
                        />
                    </div>
                </div>

                {/* KOLOM KANAN */}
                <div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white space-y-5">
                            {/* Status Read Only */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={data.status}
                                        readOnly
                                        className={readOnlyClass} />
                                </div>
                            </div>

                            {/* Ship From */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Ship From *</label>
                                <div className="relative">
                                    <input
                                        name="shipFrom"
                                        value={data.shipFrom}
                                        onChange={handleChange}
                                        readOnly
                                        className={readOnlyClass}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white space-y-5">
                            {/* Actual Ship Date */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Actual Ship Date</label>
                                <input
                                    type="date"
                                    name="actualShipDate"
                                    value={data.actualShipDate}
                                    readOnly
                                    className={readOnlyClass}
                                />
                            </div>

                            {/* Ship Date */}
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Ship Date</label>
                                <input
                                    type="date"
                                    name="shipDate"
                                    value={data.shipDate}
                                    readOnly
                                    className={readOnlyClass}
                                />
                            </div>
                        </div>
                    </div>
                    {/* Comment Section */}
                    <div className="mt-1">
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Comment</label>
                        <textarea
                            name="comment"
                            value={data.comment}
                            readOnly
                            rows={2}
                            className={readOnlyClass}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}