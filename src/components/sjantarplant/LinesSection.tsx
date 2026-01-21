'use client'

import { Dispatch, SetStateAction } from 'react'
import { SjPlantLine } from '@/types/sjPlant' 
import ScanInput from './ScanInput' 
import ScanResultTable from './ScanResultTable' 

interface LinesSectionProps {
    lines: SjPlantLine[];
    setLines: Dispatch<SetStateAction<SjPlantLine[]>>;
}

export default function LinesSection({ lines, setLines }: LinesSectionProps) {

    // --- LOGIC UTAMA: Parsing Data ---
    const handleProcessScan = (rawValue: string) => {

        // Setup variabel default
        let partNum = rawValue;
        let partDesc = '';
        let lotNum = '';
        let qty = 0;
        let guidFromQr = '';
        let timestampFromQr = '';

        // Logic Parsing Split '#' (Format: PARTNUM#DESC#LOT#QTY)
        if (rawValue.includes('#')) {
            const parts = rawValue.split('#');
            if (parts.length >= 1) partNum = parts[0];
            if (parts.length >= 2) partDesc = parts[1];
            if (parts.length >= 3) lotNum = parts[2];
            if (parts.length >= 4) qty = parseFloat(parts[3]) || 0;
            if (parts.length >= 5) guidFromQr = parts[4];
            if (parts.length >= 6) timestampFromQr = parts[5];
        }

        // 2. Buat Object sesuai tipe SjPlantLine (Tipe data Parent)
        const newLine: SjPlantLine = {
            sysRowId: guidFromQr,             
            lineNum: lines.length + 1,      // Generate No Urut
            partNum: partNum,
            partDesc: partDesc,
            lotNum: lotNum,
            qty: qty,
            uom: '',          // Default kosong
            warehouseCode: '',  // Default kosong
            binNum: '',         // Default kosong
            status: 'OPEN',
            comment: '',
            qrCode: rawValue,   // Simpan raw QR
            timestamp: timestampFromQr
        };

        // 3. Update State milik Parent
        setLines(prev => [newLine, ...prev]);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm mt-2 p-6 border border-gray-200">
            <h3 className="font-bold text-lg text-gray-700 mb-4">Lines Detail</h3>

            {/* BAGIAN 1: INPUT SCANNER */}
            <ScanInput onScan={handleProcessScan} />

            {/* BAGIAN 2: GRID HASIL PARSING */}
            <ScanResultTable items={lines} />
        </div>
    )
}