'use client'

import { SjPlantHeader } from '@/types/sjPlant'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { ApiShip } from '@/api/sjplant/ship'

interface HeaderSectionProps {
    data: SjPlantHeader;
    plantList: ApiShip[];
    onChange: (field: keyof SjPlantHeader, value: string | boolean | number) => void;
    isReadOnly?: boolean;
}

export default function HeaderSection({ data, plantList, onChange, isReadOnly = false }: HeaderSectionProps) {

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

    const inputClass = "w-full text-sm border border-gray-400 rounded-md px-4 py-2 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 shadow-sm transition-all outline-none";

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
                                onChange={handleChange}
                                disabled={isReadOnly}
                                className={`${inputClass} pr-10`}
                                placeholder="Pack Num"
                            />
                        </div>
                    </div>

                    {/* Ship From */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Ship From *</label>
                        <div className="relative">
                            <select
                                name="shipFrom"
                                value={data.shipFrom}
                                onChange={handleChange}
                                disabled={isReadOnly}
                                className={`${inputClass} appearance-none pr-10 cursor-pointer`}
                            >
                                <option value=""></option>
                                {plantList.map((plant) => (
                                    <option key={plant.RowIdent} value={plant.Warehse_Address3}>
                                        {plant.Warehse_Address3}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                            </div>
                        </div>
                    </div>

                    {/* Ship To */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Ship To *</label>
                        <div className="relative">
                            <select
                                name="shipTo"
                                value={data.shipTo}
                                onChange={handleChange}
                                disabled={isReadOnly}
                                className={`${inputClass} appearance-none pr-10 cursor-pointer`}
                            >
                                <option value=""></option>
                                {plantList.map((plant) => (
                                    <option key={plant.RowIdent} value={plant.Warehse_Address3}>
                                        {plant.Warehse_Address3}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                            </div>
                        </div>
                    </div>

                    {/* Actual Ship Date */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Actual Ship Date</label>
                        <input
                            type="date"
                            name="actualShipDate"
                            value={data.actualShipDate}
                            onChange={handleChange}
                            className={inputClass}
                        />
                    </div>

                    {/* TGP Checkbox */}
                    <div className="flex items-center gap-3 pt-2">
                        <input
                            type="checkbox"
                            name="isTgp"
                            checked={data.isTgp}
                            onChange={handleChange}
                            id="tgpCheck"
                            className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <label htmlFor="tgpCheck" className="text-sm font-semibold text-gray-700 cursor-pointer select-none">TGP</label>
                    </div>
                </div>

                {/* KOLOM KANAN (Options & Status) */}
                <div className="space-y-6">

                    <div className="bg-white">
                        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider pb-3">Options</h4>
                        {/* Shipped Checkbox */}
                        <div className="flex items-center gap-3 mb-4">
                            <input
                                type="checkbox"
                                name="isShipped"
                                checked={data.isShipped}
                                onChange={handleChange}
                                id="shippedCheck"
                                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                            />
                            <label htmlFor="shippedCheck" className="text-sm font-medium text-gray-700 cursor-pointer select-none">Shipped</label>
                        </div>

                        {/* Ship Date */}
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Ship Date</label>
                            <input
                                type="date"
                                name="shipDate"
                                value={data.shipDate}
                                onChange={handleChange}
                                className={`${inputClass} bg-white`}
                            />
                        </div>

                        {/* Status Read Only */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                            <div className="text-sm font-bold px-4 py-2 border rounded-lg border-gray-400 text-gray-600">{data.status}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comment Section */}
            <div className="mt-8">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Comment</label>
                <textarea
                    name="comment"
                    value={data.comment}
                    onChange={handleChange}
                    rows={3}
                    className={inputClass}
                    placeholder="Type any additional notes here..."
                />
            </div>
        </div>
    )
}