'use client'

import { Dispatch, SetStateAction, useEffect, useCallback } from 'react'
import { SjPlantLine } from '@/types/sjPlant'
import { getPartBinList } from '@/api/rcvplant/bin'
import { getPartWarehouseList } from '@/api/rcvplant/whse'

interface SJLineTableProps {
    lines: SjPlantLine[];
    setLines: Dispatch<SetStateAction<SjPlantLine[]>>;
    isLocked: boolean;
}

export default function SJLineTable({ lines, setLines, isLocked }: SJLineTableProps) {

    useEffect(() => {
        const fetchAllWarehouses = async () => {
            // Kita gunakan map untuk menjalankan fetch secara paralel
            const updatedLines = await Promise.all(lines.map(async (line) => {
                // Jika sudah ada list warehouse-nya, tidak perlu ambil lagi
                if (line.availableWarehouses && line.availableWarehouses.length > 0) {
                    return line;
                }

                // Ambil data warehouse berdasarkan PartNum dan ShipTo (Alamat)
                const resWh = await getPartWarehouseList(line.partNum, line.shipTo || '');

                if (resWh.success && resWh.data) {
                    return {
                        ...line,
                        availableWarehouses: resWh.data.map(w => ({
                            code: w.PartWhse_WarehouseCode,
                            name: w.Warehse_Description
                        }))
                    };
                }
                return line;
            }));

            // Bandingkan untuk menghindari infinite loop: 
            // Update state hanya jika data availableWarehouses benar-benar baru terisi
            const isDifferent = updatedLines.some((l, idx) =>
                l.availableWarehouses?.length !== lines[idx].availableWarehouses?.length
            );

            if (isDifferent) {
                setLines(updatedLines);
            }
        };

        if (lines.length > 0 && !isLocked) {
            fetchAllWarehouses();
        }
    }, [lines.length, isLocked, setLines]);


    const updateLineState = (id: number, field: keyof SjPlantLine, value: string | number) => {
        setLines((prevLines) => prevLines.map(line => {
            if (line.lineNum === id) {
                return { ...line, [field]: value }
            }
            return line
        }))
    }

    const handleWarehouseChange = async (id: number, newWhseCode: string) => {
        // Cari data line yang sedang diubah
        const currentLine = lines.find(l => l.lineNum === id);
        if (!currentLine) return;

        // 1. Update UI Warehouse & Reset Bin segera
        setLines(prev => prev.map(line => {
            if (line.lineNum === id) {
                return {
                    ...line,
                    whTo: newWhseCode,
                    binTo: '',
                    availableBins: []
                }
            }
            return line;
        }));

        if (!newWhseCode) return;

        // 2. Fetch Bin berdasarkan Warehouse baru
        const resBin = await getPartBinList(currentLine.partNum, newWhseCode, currentLine.lotNum);

        if (resBin.success && resBin.data) {
            const newBinOptions = resBin.data.map(b => ({
                code: b.BinNum,
                desc: b.BinDesc || b.BinNum,
                qty: b.QtyOnHand
            }));

            // 3. Update state dengan pilihan Bin yang baru
            setLines(prev => prev.map(line => {
                if (line.lineNum === id) {
                    return {
                        ...line,
                        availableBins: newBinOptions,
                        // Jika bin cuma ada 1, otomatis pilihkan
                        binTo: newBinOptions.length === 1 ? newBinOptions[0].code : ''
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

    // Helper class untuk header agar tidak terlalu panjang di kodingan bawah
    // Menggunakan w-[..px] dan min-w-[..px] agar kolom kaku (fixed)
    const thClass = "px-2 py-3 text-left text-xs font-bold text-gray-600 uppercase bg-gray-50 border-b border-gray-200";

    return (
        <div className="mt-4 mb-4 border border-gray-200 rounded-lg shadow-sm">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-bold text-gray-700">Line Data</h3>
            </div>

            {/* Container Scroll Horizontal */}
            <div className="overflow-x-auto">
                {/* min-w-max memaksa tabel melebar sesuai total lebar kolom */}
                <table className="min-w-max divide-y divide-gray-200">
                    <thead>
                        <tr>
                            <th className={`${thClass} text-center w-12.5 min-w-12.5`}>Line</th>
                            <th className={`${thClass} w-37.5 min-w-37.5`}>Part Number</th>
                            <th className={`${thClass} w-62.5 min-w-62.5`}>Part Description</th>
                            <th className={`${thClass} text-center w-15 min-w-15`}>IUM</th>
                            <th className={`${thClass} w-30 min-w-30`}>Lot Number</th>
                            <th className={`${thClass} w-30 min-w-30`}>Ship To</th>
                            <th className={`${thClass} w-35 min-w-35`}>WH To</th>
                            <th className={`${thClass} w-20 min-w-20`}>Bin To</th>
                            <th className={`${thClass} text-center w-22.5 min-w-22.5`}>Qty Pcs</th>
                            <th className={`${thClass} text-center w-22.5 min-w-22.5`}>Qty Terima</th>
                            <th className={`${thClass} text-center w-28 min-w-28`}>Qty Htg Pack</th>
                            <th className={`${thClass} text-center w-25 min-w-25`}>Qty Htg Pcs</th>
                            <th className={`${thClass} w-50 min-w-50`}>Keterangan Receive</th>
                            <th className={`${thClass} w-50 min-w-50`}>Keterangan Shipment</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {lines.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-6 text-gray-400 text-sm italic bg-gray-50">
                                    Belum ada data.
                                </td>
                            </tr>
                        ) : (
                            lines.map((line, idx) => (
                                <tr key={line.lineNum} className="hover:bg-blue-50 transition-colors">
                                    {/* 1. Line */}
                                    <td className="px-2 py-2 text-center text-xs text-gray-500">
                                        {lines.length - idx}
                                    </td>

                                    {/* 2. Part Number */}
                                    <td className="px-2 py-2">
                                        <input type="text" value={line.partNum} readOnly className={readOnlyClass} title={line.partNum} />
                                    </td>

                                    {/* 3. Part Desc */}
                                    <td className="px-2 py-2">
                                        <input type="text" value={line.partDesc} readOnly className={readOnlyClass} title={line.partDesc} />
                                    </td>

                                    {/* 4. IUM */}
                                    <td className="px-2 py-2">
                                        <input type="text" value={line.uom} readOnly className={`${readOnlyClass} text-center ${line.uom === 'ERR' ? 'text-red-500 font-bold' : ''}`} />
                                    </td>

                                    {/* 5. Lot Number */}
                                    <td className="px-2 py-2">
                                        <input type="text" value={line.lotNum} readOnly className={readOnlyClass} title={line.lotNum} />
                                    </td>

                                    {/* 6. Ship To (ReadOnly) */}
                                    <td className="px-2 py-2">
                                        <input type="text" value={line.shipTo} readOnly className={readOnlyClass} title={line.shipTo} />
                                    </td>

                                    {/* 7. Wh To (Dropdown) */}
                                    <td className="px-2 py-2">
                                        <select
                                            value={line.whTo}
                                            onChange={(e) => handleWarehouseChange(line.lineNum, e.target.value)}
                                            className={selectClass}
                                            disabled={isLocked}
                                        >
                                            <option value="">Pilih Wh</option>
                                            {line.availableWarehouses?.map((wh) => (
                                                <option key={wh.code} value={wh.code}>{wh.name}</option>
                                            ))}
                                        </select>
                                    </td>

                                    {/* 8. Bin To (Dropdown) */}
                                    <td className="px-2 py-2">
                                        <div className="relative w-full">
                                            <input
                                                type="text"
                                                value={line.binTo}
                                                disabled={isLocked || !line.whTo}
                                                onChange={(e) => updateLineState(line.lineNum, 'binTo', e.target.value.toUpperCase())}
                                                className={`${inputClass} pr-6 uppercase`}
                                                placeholder={line.whTo ? "Ketik/Pilih" : "-"}
                                            />
                                            {line.availableBins && line.availableBins.length > 0 && (
                                                <>
                                                    <div className="absolute right-1 top-0 bottom-0 flex items-center px-1 pointer-events-none text-gray-500">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                    </div>
                                                    <select
                                                        className="absolute inset-y-0 right-0 w-8 opacity-0 cursor-pointer text-xs"
                                                        value=""
                                                        onChange={(e) => e.target.value && updateLineState(line.lineNum, 'binTo', e.target.value)}
                                                        disabled={!line.whTo}
                                                    >
                                                        <option value="" disabled>Pilih Bin</option>
                                                        {line.availableBins.map((bin) => (
                                                            <option key={bin.code} value={bin.code}>{bin.code}</option>
                                                        ))}
                                                    </select>
                                                </>
                                            )}
                                        </div>
                                    </td>

                                    {/* 9. Qty Ship */}
                                    <td className="px-2 py-2">
                                        <input type="number" value={line.qty} readOnly className={`${readOnlyClass} text-center`} />
                                    </td>

                                    {/* 10. Qty Terima */}
                                    <td className="px-2 py-2">
                                        <input
                                            type="number"
                                            value={line.qty}
                                            readOnly
                                            className={`${readOnlyClass} text-center`}
                                        />
                                    </td>

                                    {/* Qty Hitung Pack*/}
                                    <td className="px-2 py-2">
                                        <input
                                            type="number"
                                            value={line.qtyPack ?? ''}
                                            disabled={isLocked}
                                            onFocus={(e) => e.target.select()}
                                            onChange={(e) => updateLineState(line.lineNum, 'qtyPack', parseFloat(e.target.value) || 0)}
                                            className={`${inputClass} text-center`}
                                        />
                                    </td>

                                    {/* Qty Hitung Pcs*/}
                                    <td className="px-2 py-2">
                                        <input
                                            type="number"
                                            value={line.qtyHitungPcs ?? ''}
                                            disabled={isLocked}
                                            onFocus={(e) => e.target.select()}
                                            onChange={(e) => updateLineState(line.lineNum, 'qtyHitungPcs', parseFloat(e.target.value) || 0)}
                                            className={`${inputClass} text-center`}
                                        />
                                    </td>

                                    {/* 12. Ket Receive */}
                                    <td className="px-2 py-2">
                                        <input
                                            type="text"
                                            value={line.rcvComment || ''}
                                            disabled={isLocked}
                                            onChange={(e) => updateLineState(line.lineNum, 'rcvComment', e.target.value)}
                                            className={inputClass}
                                            placeholder="Catatan..."
                                        />
                                    </td>

                                    {/* 13. Ket Shipment */}
                                    <td className="px-2 py-2">
                                        <input type="text" value={line.comment} readOnly className={readOnlyClass} title={line.comment} />
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