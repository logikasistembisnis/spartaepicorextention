'use client'

import { Dispatch, SetStateAction } from 'react'
import { SjPlantLine } from '@/types/sjPlant'
import { getPartBinList } from '@/api/sjplant/bin'
import { TrashIcon } from '@heroicons/react/24/outline'

interface SJLineTableProps {
    lines: SjPlantLine[];
    setLines: Dispatch<SetStateAction<SjPlantLine[]>>;
    onDeleteLine: (line: SjPlantLine) => void;
    isLocked: boolean;
}

export default function SJLineTable({ lines, setLines, onDeleteLine, isLocked }: SJLineTableProps) {

    const updateLineState = (id: number, field: keyof SjPlantLine, value: string | number) => {
        setLines((prevLines) => prevLines.map(line => {
            if (line.lineNum === id) {
                return { ...line, [field]: value }
            }
            return line
        }))
    }

    const handleWarehouseChange = async (id: number, newWhseCode: string) => {
        const currentLine = lines.find(l => l.lineNum === id);
        if (!currentLine) return;

        setLines(prev => prev.map(line => {
            if (line.lineNum === id) {
                return { ...line, warehouseCode: newWhseCode, binNum: '', availableBins: [] }
            }
            return line;
        }));

        if (!newWhseCode) return;

        const resBin = await getPartBinList(currentLine.partNum, newWhseCode, currentLine.lotNum);

        if (resBin.success && resBin.data) {
            const newBinOptions = resBin.data.map(b => ({
                code: b.BinNum,
                desc: b.BinDesc || b.BinNum,
                qty: b.QtyOnHand
            }));

            setLines(prev => prev.map(line => {
                if (line.lineNum === id) {
                    return {
                        ...line,
                        availableBins: newBinOptions,
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
                            <th className={`${thClass} text-center w-[50px] min-w-[50px]`}>Line</th>
                            <th className={`${thClass} w-[150px] min-w-[150px]`}>Part No</th>
                            <th className={`${thClass} w-[250px] min-w-[250px]`}>Part Desc</th>
                            <th className={`${thClass} text-center w-[60px] min-w-[60px]`}>IUM</th>
                            <th className={`${thClass} w-[120px] min-w-[120px]`}>Lot Number</th>
                            <th className={`${thClass} w-[120px] min-w-[120px]`}>Ship To</th>
                            <th className={`${thClass} w-[140px] min-w-[140px]`}>Wh To</th>
                            <th className={`${thClass} w-[140px] min-w-[140px]`}>Bin To</th>
                            <th className={`${thClass} text-center w-[90px] min-w-[90px]`}>Qty Ship</th>
                            <th className={`${thClass} text-center w-[90px] min-w-[90px]`}>Qty Terima</th>
                            <th className={`${thClass} text-center w-[90px] min-w-[90px]`}>Qty Hitung</th>
                            <th className={`${thClass} w-[200px] min-w-[200px]`}>Ket Receive</th>
                            <th className={`${thClass} w-[200px] min-w-[200px]`}>Ket Shipment</th>
                            <th className={`${thClass} text-center w-[60px] min-w-[60px]`}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {lines.length === 0 ? (
                            <tr>
                                <td colSpan={14} className="text-center py-6 text-gray-400 text-sm italic bg-gray-50">
                                    Belum ada data. Silakan isi scan pada kolom input di atas.
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
                                        <input type="text" value={(line as any).shipTo || ''} readOnly className={readOnlyClass} />
                                    </td>

                                    {/* 7. Wh To (Dropdown) */}
                                    <td className="px-2 py-2">
                                        <select
                                            value={line.warehouseCode}
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
                                                value={line.binNum}
                                                disabled={isLocked || !line.warehouseCode}
                                                onChange={(e) => updateLineState(line.lineNum, 'binNum', e.target.value.toUpperCase())}
                                                className={`${inputClass} pr-6 uppercase`}
                                                placeholder={line.warehouseCode ? "Ketik/Pilih" : "-"}
                                            />
                                            {line.availableBins && line.availableBins.length > 0 && (
                                                <>
                                                    <div className="absolute right-1 top-0 bottom-0 flex items-center px-1 pointer-events-none text-gray-500">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                    </div>
                                                    <select
                                                        className="absolute inset-y-0 right-0 w-8 opacity-0 cursor-pointer text-xs"
                                                        value=""
                                                        onChange={(e) => e.target.value && updateLineState(line.lineNum, 'binNum', e.target.value)}
                                                        disabled={!line.warehouseCode}
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
                                            value={(line as any).qtyReceived ?? ''}
                                            disabled={isLocked}
                                            onChange={(e) => updateLineState(line.lineNum, 'qtyReceived' as any, parseFloat(e.target.value) || 0)}
                                            className={`${inputClass} text-center bg-yellow-50`}
                                        />
                                    </td>

                                    {/* 11. Qty Hitung */}
                                    <td className="px-2 py-2">
                                        <input
                                            type="number"
                                            value={(line as any).qtyCounted ?? ''}
                                            disabled={isLocked}
                                            onChange={(e) => updateLineState(line.lineNum, 'qtyCounted' as any, parseFloat(e.target.value) || 0)}
                                            className={`${inputClass} text-center`}
                                        />
                                    </td>

                                    {/* 12. Ket Receive */}
                                    <td className="px-2 py-2">
                                        <input
                                            type="text"
                                            value={(line as any).rcvComment || ''}
                                            disabled={isLocked}
                                            onChange={(e) => updateLineState(line.lineNum, 'rcvComment' as any, e.target.value)}
                                            className={inputClass}
                                            placeholder="Catatan..."
                                        />
                                    </td>

                                    {/* 13. Ket Shipment */}
                                    <td className="px-2 py-2">
                                        <input type="text" value={line.comment} readOnly className={readOnlyClass} title={line.comment} />
                                    </td>

                                    {/* Aksi */}
                                    <td className="px-2 py-2 text-center">
                                        <button onClick={() => onDeleteLine(line)} className="text-red-600 hover:text-red-800" title="Hapus Line">
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
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