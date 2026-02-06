'use client'

import { Dispatch, SetStateAction, useState } from 'react'
import { SjPlantLine } from '@/types/sjPlant'
import { getPartBinList } from '@/api/sjplant/bin'
import { TrashIcon } from '@heroicons/react/24/outline'
import AddManualLineModal from '@/components/modals/sjplant/AddManualLine'
import { getPartLotList } from '@/api/sjplant/lot'

interface SJLineTableProps {
    lines: SjPlantLine[];
    setLines: Dispatch<SetStateAction<SjPlantLine[]>>;
    onDeleteLine: (line: SjPlantLine) => void;
    isLocked: boolean;
    shipFrom: string;
}

export default function SJLineTable({ lines, setLines, onDeleteLine, isLocked, shipFrom }: SJLineTableProps) {
    const [showModal, setShowModal] = useState(false)
    const [loadingLots, setLoadingLots] = useState<number | null>(null); // State loading per line

    // Fungsi update data per baris (misal ganti Warehouse / Qty manual)
    const updateLineState = (id: number, field: keyof SjPlantLine, value: string | number) => {
        setLines((prevLines) => prevLines.map(line => {
            if (line.lineNum === id) {
                return { ...line, [field]: value }
            }
            return line
        }))
    }

    // --- LOGIC FETCH LOT (LAZY LOAD SAAT KLIK) ---
    const handleLotFocus = async (line: SjPlantLine) => {
        // Cuma fetch kalau Manual, belum ada data lot, dan tidak sedang loading
        if (line.source === 'MANUAL' && (!line.availableLots || line.availableLots.length === 0)) {
            setLoadingLots(line.lineNum);
            try {
                const res = await getPartLotList(line.partNum);
                if (res.success && res.data) {
                    const lotOptions = res.data.map(l => ({ lotNum: l.LotNum }));

                    setLines(prev => prev.map(l => {
                        if (l.lineNum === line.lineNum) {
                            return { ...l, availableLots: lotOptions };
                        }
                        return l;
                    }));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingLots(null);
            }
        }
    }

    // --- LOGIC GANTI LOT (RESET BIN) ---
    const handleLotChange = (id: number, newLot: string) => {
        setLines(prev => prev.map(line => {
            if (line.lineNum === id) {
                // Ganti Lot, Kosongkan Bin (karena Bin tergantung Lot)
                return {
                    ...line,
                    lotNum: newLot,
                    binNum: '',
                    availableBins: []
                };
            }
            return line;
        }));
    }

    const handleWarehouseChange = async (id: number, newWhseCode: string) => {
        // 1. Cari baris yang sedang diedit untuk ambil PartNum & LotNum
        const currentLine = lines.find(l => l.lineNum === id);
        if (!currentLine) return;

        // 2. Update Warehouse Code dulu di UI (biar responsif), dan kosongkan BinNum
        setLines(prev => prev.map(line => {
            if (line.lineNum === id) {
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
                if (line.lineNum === id) {
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
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-700">Line Data</h3>
                {!isLocked && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        + Tambah Line
                    </button>
                )}
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
                            <th className="px-2 py-3 text-center text-xs font-bold text-gray-600 uppercase w-12">Aksi</th>
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
                                <tr key={line.lineNum} className="hover:bg-blue-50 transition-colors">
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
                                            onChange={(e) => handleWarehouseChange(line.lineNum, e.target.value)}
                                            className={selectClass}
                                            disabled={isLocked}
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
                                        {/* KONDISI 1: QR CODE (READ ONLY) */}
                                        {line.source === 'QR' ? (
                                            <input
                                                readOnly
                                                value={line.lotNum}
                                                className={readOnlyClass}
                                            />
                                        ) : (
                                            /* KONDISI 2: MANUAL (DROPDOWN / INPUT) */
                                            <div className="relative w-full">
                                                <input
                                                    type="text"
                                                    value={line.lotNum}
                                                    onChange={(e) => handleLotChange(line.lineNum, e.target.value.toUpperCase())}
                                                    onFocus={() => handleLotFocus(line)} // Fetch saat klik
                                                    className={`${inputClass} uppercase pr-6`}
                                                    placeholder={loadingLots === line.lineNum ? "Loading..." : "Ketik/Pilih"}
                                                    disabled={isLocked}
                                                />

                                                {/* Dropdown Trigger Arrow */}
                                                {(line.availableLots && line.availableLots.length > 0) && (
                                                    <>
                                                        <div className="absolute right-1 top-0 bottom-0 flex items-center px-1 pointer-events-none text-gray-500">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                        </div>
                                                        <select
                                                            className="absolute inset-y-0 right-0 w-full opacity-0 cursor-pointer text-xs"
                                                            value=""
                                                            onChange={(e) => {
                                                                if (e.target.value) handleLotChange(line.lineNum, e.target.value)
                                                            }}
                                                            disabled={isLocked}
                                                        >
                                                            <option value="" disabled>Pilih Lot</option>
                                                            {line.availableLots.map((lot) => (
                                                                <option key={lot.lotNum} value={lot.lotNum}>
                                                                    {lot.lotNum}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </td>

                                    {/* 7. Bin From (Dropdown - Editable) */}
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

                                            {/* SELECT TRIGGER: Hanya muncul jika ada opsi Bin */}
                                            {line.availableBins && line.availableBins.length > 0 && (
                                                <>
                                                    {/* Visual Icon Panah (Pojok Kanan) */}
                                                    <div className="absolute right-1 top-0 bottom-0 flex items-center px-1 pointer-events-none text-gray-500">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                    </div>

                                                    <select
                                                        className="absolute inset-y-0 right-0 w-8 opacity-0 cursor-pointer text-xs"
                                                        value=""
                                                        onChange={(e) => {
                                                            if (e.target.value) {
                                                                updateLineState(line.lineNum, 'binNum', e.target.value);
                                                            }
                                                        }}
                                                        disabled={!line.warehouseCode}
                                                    >
                                                        <option value="" disabled>Pilih Bin</option>
                                                        {line.availableBins.map((bin) => (
                                                            <option key={bin.code} value={bin.code}>
                                                                {bin.code}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </>
                                            )}
                                        </div>
                                    </td>

                                    {/* Qty Ship */}
                                    <td className="px-2 py-2">
                                        <input
                                            type="number"
                                            value={line.qty}
                                            disabled={isLocked}
                                            onFocus={(e) => e.target.select()}
                                            onChange={(e) => updateLineState(line.lineNum, 'qty', parseFloat(e.target.value) || 0)}
                                            className={`${readOnlyClass} text-center`}
                                        />
                                    </td>

                                    {/* 9. Keterangan (Editable Text) */}
                                    <td className="px-2 py-2">
                                        <input
                                            type="text"
                                            value={line.comment}
                                            disabled={isLocked}
                                            onChange={(e) => updateLineState(line.lineNum, 'comment', e.target.value)}
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

                                    {/* Hapus line */}
                                    <td className="px-2 py-2 text-center">
                                        <button
                                            onClick={() => onDeleteLine(line)}
                                            className="text-red-600 hover:text-red-800"
                                            title="Hapus Line"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <AddManualLineModal
                open={showModal}
                onClose={() => setShowModal(false)}
                nextLineNum={lines.length > 0 ? Math.max(...lines.map(l => l.lineNum)) + 1 : 1}
                onAdd={(line) => setLines(prev => [line, ...prev])}
                shipFrom={shipFrom}
            />
        </div>
    )
}