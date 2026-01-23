'use client'

import { Dispatch, SetStateAction } from 'react'
import { SjPlantLine } from '@/types/sjPlant'
import { getPartBinList } from '@/api/sjplant/bin'

interface SJLineTableProps {
    lines: SjPlantLine[];
    setLines: Dispatch<SetStateAction<SjPlantLine[]>>;
}

export default function SJLineTable({ lines, setLines }: SJLineTableProps) {

    // Fungsi update data per baris (misal ganti Warehouse / Qty manual)
    const updateLineState = (id: string, field: keyof SjPlantLine, value: string | number) => {
        setLines((prevLines) => prevLines.map(line => {
            if (line.guid === id) {
                return { ...line, [field]: value }
            }
            return line
        }))
    }

    const handleWarehouseChange = async (id: string, newWhseCode: string) => {
        // 1. Cari baris yang sedang diedit untuk ambil PartNum & LotNum
        const currentLine = lines.find(l => l.guid === id);
        if (!currentLine) return;

        // 2. Update Warehouse Code dulu di UI (biar responsif), dan kosongkan BinNum
        setLines(prev => prev.map(line => {
            if (line.guid === id) {
                return { ...line, warehouseCode: newWhseCode, binNum: '', availableBins: [] }
            }
            return line;
        }));

        // 3. Jika user memilih "Pilih Wh" (kosong), stop di sini
        if (!newWhseCode) return;

        // 4. Panggil API Fetch Bin
        const resBin = await getPartBinList(currentLine.partNum, newWhseCode, currentLine.lotNum);

        // 5. Update State dengan hasil Bin baru
        if (resBin.success && resBin.data) {
            const newBinOptions = resBin.data.map(b => ({
                code: b.BinNum,
                desc: b.BinDesc || b.BinNum,
                qty: b.QtyOnHand
            }));

            setLines(prev => prev.map(line => {
                if (line.guid === id) {
                    return {
                        ...line,
                        availableBins: newBinOptions,
                        // UX: Jika cuma ada 1 bin, otomatis pilih
                        binNum: newBinOptions.length === 1 ? newBinOptions[0].code : ''
                    }
                }
                return line;
            }));
        }
    };

    // Styles
    const inputClass = "w-full text-xs border-gray-200 rounded focus:ring-blue-500 focus:border-blue-500 p-1 text-gray-700 bg-white";
    const selectClass = "w-full text-xs border-gray-200 rounded focus:ring-blue-500 focus:border-blue-500 p-1 text-gray-700 bg-white";
    const readOnlyClass = "w-full text-xs bg-gray-50 border-none p-1 text-gray-500 font-medium cursor-default";

    return (
        <div className="mt-4 mb-4 border border-gray-200 rounded-lg shadow-sm">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-bold text-gray-700">Line Data</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-2 py-3 text-center text-xs font-bold text-gray-600 uppercase w-10">Line</th>
                            <th className="px-2 py-3 text-left text-xs font-bold text-gray-600 uppercase min-w-30">Part Number</th>
                            <th className="px-2 py-3 text-left text-xs font-bold text-gray-600 uppercase min-w-37.5">Part Desc</th>
                            <th className="px-2 py-3 text-center text-xs font-bold text-gray-600 uppercase w-16">IUM</th>
                            <th className="px-2 py-3 text-left text-xs font-bold text-gray-600 uppercase w-28">Wh From</th>
                            <th className="px-2 py-3 text-left text-xs font-bold text-gray-600 uppercase min-w-25">Lot Num</th>
                            <th className="px-2 py-3 text-left text-xs font-bold text-gray-600 uppercase w-28">Bin From</th>
                            <th className="px-2 py-3 text-center text-xs font-bold text-gray-600 uppercase w-20">Qty Ship</th>
                            <th className="px-2 py-3 text-left text-xs font-bold text-gray-600 uppercase min-w-37.5">Keterangan</th>
                            <th className="px-2 py-3 text-center text-xs font-bold text-gray-600 uppercase w-20">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {lines.length === 0 ? (
                            <tr>
                                <td colSpan={11} className="text-center py-6 text-gray-400 text-sm italic bg-gray-50">
                                    Belum ada data. Silakan isi scan pada kolom input di atas.
                                </td>
                            </tr>
                        ) : (
                            lines.map((line, idx) => (
                                <tr key={line.guid} className="hover:bg-blue-50 transition-colors">
                                    {/* 1. Line (Auto numbering based on array index for display) */}
                                    <td className="px-2 py-2 text-center text-xs text-gray-500">
                                        {lines.length - idx}
                                    </td>

                                    {/* 2. Part Num (Read Only dari Scan) */}
                                    <td className="px-2 py-2">
                                        <input
                                            type="text"
                                            value={line.partNum}
                                            readOnly
                                            className={readOnlyClass}
                                            title={line.partNum}
                                        />
                                    </td>

                                    {/* 3. Part Desc (Read Only dari Scan) */}
                                    <td className="px-2 py-2">
                                        <input
                                            type="text"
                                            value={line.partDesc}
                                            readOnly
                                            className={readOnlyClass}
                                            title={line.partDesc}
                                        />
                                    </td>

                                    {/* 4. IUM (Auto Fetch) */}
                                    <td className="px-2 py-2">
                                        <input
                                            type="text"
                                            value={line.uom}
                                            readOnly
                                            className={`${readOnlyClass} text-center ${line.uom === 'ERR' ? 'text-red-500 font-bold' : ''}`}
                                            title={line.uom}
                                        />
                                    </td>

                                    {/* 5. Warehouse (Dropdown - Editable) */}
                                    <td className="px-2 py-2">
                                        <select
                                            value={line.warehouseCode}
                                            onChange={(e) => handleWarehouseChange(line.guid, e.target.value)}
                                            className={selectClass}
                                            title={line.warehouseCode}
                                        >
                                            <option value="">Pilih Wh</option>
                                            {line.availableWarehouses?.map((wh) => (
                                                <option key={wh.code} value={wh.code}>
                                                    {wh.name}
                                                </option>
                                            ))}
                                        </select>
                                        {(!line.availableWarehouses || line.availableWarehouses.length === 0) && (
                                            <div className="text-[10px] text-red-500 mt-1">
                                                No Wh Found
                                            </div>
                                        )}
                                    </td>

                                    {/* 6. Lot Num (Read Only dari Scan) */}
                                    <td className="px-2 py-2">
                                        <input
                                            type="text"
                                            value={line.lotNum}
                                            readOnly
                                            className={readOnlyClass}
                                            title={line.lotNum}
                                        />
                                    </td>

                                    {/* 7. Bin From (Dropdown - Editable) */}
                                    <td className="px-2 py-2">
                                        <select
                                            value={line.binNum}
                                            onChange={(e) => updateLineState(line.guid, 'binNum', e.target.value)}
                                            className={selectClass}
                                            // Disable jika belum pilih gudang atau bins kosong
                                            disabled={!line.warehouseCode || !line.availableBins?.length}
                                            title={line.binNum}
                                        >
                                            <option value="">Pilih Bin</option>
                                            {line.availableBins?.map((bin) => (
                                                <option key={bin.code} value={bin.code}>
                                                    {bin.code}
                                                </option>
                                            ))}
                                        </select>
                                        {/* Info helper jika kosong */}
                                        {line.warehouseCode && (!line.availableBins || line.availableBins.length === 0) && (
                                            <div className="text-[9px] text-red-400 mt-1 italic">
                                                No Bin Found
                                            </div>
                                        )}
                                    </td>

                                    {/* 8. Qty Ship (Editable Number, default dari scan) */}
                                    <td className="px-2 py-2">
                                        <input
                                            type="number"
                                            value={line.qty}
                                            onChange={(e) => updateLineState(line.guid, 'qty', parseFloat(e.target.value) || 0)}
                                            className={`${readOnlyClass} text-center`}
                                        />
                                    </td>

                                    {/* 9. Keterangan (Editable Text) */}
                                    <td className="px-2 py-2">
                                        <input
                                            type="text"
                                            value={line.comment}
                                            onChange={(e) => updateLineState(line.guid, 'comment', e.target.value)}
                                            className={inputClass}
                                            placeholder="..."
                                        />
                                    </td>

                                    {/* 10. Status */}
                                    <td className="px-2 py-2 text-center">
                                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold border border-blue-200">
                                            {line.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}