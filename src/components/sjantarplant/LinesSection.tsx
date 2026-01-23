'use client'

import { Dispatch, SetStateAction, useState, useEffect, useRef } from 'react'
import { SjPlantLine } from '@/types/sjPlant'
import ScanInput from './ScanInput'
import ScanResultTable from './ScanResultTable'
import SJLineTable from './SJLineTable'
import { getPartIum } from '@/api/sjplant/ium'
import { getPartWarehouseList } from '@/api/sjplant/whse'
import { getPartBinList } from '@/api/sjplant/bin'

const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID(); // Modern browser
    }
    // Fallback untuk browser lama
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

interface LinesSectionProps {
    lines: SjPlantLine[];
    setLines: Dispatch<SetStateAction<SjPlantLine[]>>;
    shipFrom: string;
}

export default function LinesSection({ lines, setLines, shipFrom }: LinesSectionProps) {
    const [scanHistory, setScanHistory] = useState<SjPlantLine[]>([]);

    const hasInitialized = useRef(false);
    useEffect(() => {
        if (!hasInitialized.current && lines.length > 0) {
            const timer = setTimeout(() => {
                setScanHistory(lines);
                hasInitialized.current = true;
            }, 0);

            // Cleanup function (Best Practice)
            return () => clearTimeout(timer);
        }
    }, [lines]);

    // --- LOGIC UTAMA: Parsing Data ---
    const handleProcessScan = async (rawValue: string) => {

        // Setup variabel default
        let partNum = rawValue;
        let partDesc = '';
        let lotNum = '';
        let qty = 0;
        let guidFromQr = '';
        let timestampFromQr = '';

        // Logic Parsing Split '#' (Format: PARTNUM#DESC#LOT#QTY#GUID#TIMESTAMP)
        if (rawValue.includes('#')) {
            const parts = rawValue.split('#');
            if (parts.length >= 1) partNum = parts[0];
            if (parts.length >= 2) partDesc = parts[1];
            if (parts.length >= 3) lotNum = parts[2];
            if (parts.length >= 4) qty = parseFloat(parts[3]) || 0;
            if (parts.length >= 5) guidFromQr = parts[4];
            if (parts.length >= 6) timestampFromQr = parts[5];
        }

        // --- LOGIC BARU: Fetch Warehouse ---
        let fetchedWhOptions: { code: string, name: string }[] = [];
        let defaultWh = '';

        // Pastikan Ship From ada isinya sebelum panggil API
        if (shipFrom) {
            const resWh = await getPartWarehouseList(partNum, shipFrom);

            if (resWh.success && resWh.data) {
                // Mapping hasil API ke format yang mudah dibaca dropdown
                fetchedWhOptions = resWh.data.map(item => ({
                    code: item.PartWhse_WarehouseCode,
                    name: item.Warehse_Description
                }));
                if (fetchedWhOptions.length === 1) {
                    defaultWh = fetchedWhOptions[0].code;
                }
            }
        }

        let fetchedBinOptions: { code: string, desc: string, qty: number }[] = [];
        let defaultBin = '';

        if (defaultWh) {
            const resBin = await getPartBinList(partNum, defaultWh, lotNum);

            if (resBin.success && resBin.data) {
                fetchedBinOptions = resBin.data.map(b => ({
                    code: b.BinNum,
                    desc: b.BinDesc || b.BinNum,
                    qty: b.QtyOnHand
                }));

                // Jika cuma ada 1 bin, auto select
                if (fetchedBinOptions.length === 1) {
                    defaultBin = fetchedBinOptions[0].code;
                }
            }
        }

        let fetchedUom = '...';
        try {
            const res = await getPartIum(partNum);
            if (res.success && res.ium) {
                fetchedUom = res.ium;
            } else {
                fetchedUom = 'ERR';
            }
        } catch (error) {
            console.error("Gagal fetch IUM", error);
            fetchedUom = 'ERR';
        }

        const maxLineNum = lines.reduce((max, item) => {
            // Cek line utama
            let currentMax = item.lineNum > max ? item.lineNum : max;

            // Cek juga jika di dalam line itu ada pendingLogs yang mungkin punya nomor lebih besar
            if (item.pendingLogs) {
                item.pendingLogs.forEach(log => {
                    if (log.lineNum > currentMax) currentMax = log.lineNum;
                });
            }
            return currentMax;
        }, 0);

        const nextLineNum = maxLineNum + 1;

        const newLogEntry: SjPlantLine = {
            guid: guidFromQr || generateId(), // Pastikan ada ID unik
            lineNum: nextLineNum, // Nanti diset saat display
            partNum,
            partDesc,
            lotNum,
            qty, // Ini Qty pecahan (misal 3)
            uom: fetchedUom,
            warehouseCode: defaultWh,
            availableWarehouses: fetchedWhOptions,
            binNum: defaultBin,
            availableBins: fetchedBinOptions,
            status: 'LOG',
            comment: '',
            qrCode: rawValue,
            timestamp: timestampFromQr
        };

        // --- PERUBAHAN 2: LOGIC DUPLIKAT ---
        const existingLineIndex = lines.findIndex(l => l.partNum === partNum && l.lotNum === lotNum);

        if (existingLineIndex !== -1) {
            // Jika BARANG SUDAH ADA
            setLines(prevLines => prevLines.map((line) => {
                if (line.partNum === partNum && line.lotNum === lotNum) {
                    return {
                        ...line,
                        qty: line.qty + qty,
                        pendingLogs: [...(line.pendingLogs || []), newLogEntry]
                    };
                }
                return line;
            }));

            // Update tabel History (Bagian Bawah)
            setScanHistory(prev => [{ ...newLogEntry, lineNum: scanHistory.length + 1 }, ...prev]);

            return; // STOP DISINI
        }

        const newLine: SjPlantLine = {
            ...newLogEntry,
            lineNum: lines.length + 1, // Beri nomor urut baru
            status: 'UNSHIP',
        };

        setLines(prev => [newLine, ...prev]);
        setScanHistory(prev => [newLine, ...prev]); // Masukkan history juga
    };

    return (
        <div className="bg-white rounded-lg shadow-sm mt-2 p-6 border border-gray-200">
            <h3 className="font-bold text-lg text-gray-700 mb-4">Lines Detail</h3>

            {/* BAGIAN 1: INPUT SCANNER */}
            <ScanInput onScan={handleProcessScan} />

            {/* BAGIAN 2: GRID INPUT */}
            <SJLineTable lines={lines} setLines={setLines} />

            {/* BAGIAN 3: GRID HASIL PARSING */}
            <ScanResultTable items={scanHistory} />
        </div>
    )
}