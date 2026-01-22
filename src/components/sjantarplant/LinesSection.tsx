'use client'

import { Dispatch, SetStateAction } from 'react'
import { SjPlantLine } from '@/types/sjPlant' 
import ScanInput from './ScanInput' 
import ScanResultTable from './ScanResultTable' 
import SJLineTable from './SJLineTable'
import { getPartIum } from '@/api/sjplant/ium'
import { getPartWarehouseList } from '@/api/sjplant/whse'
import { getPartBinList } from '@/api/sjplant/bin'

interface LinesSectionProps {
    lines: SjPlantLine[];
    setLines: Dispatch<SetStateAction<SjPlantLine[]>>;
    shipFrom: string;
}

export default function LinesSection({ lines, setLines, shipFrom }: LinesSectionProps) {

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

        // Buat Object sesuai tipe SjPlantLine (Tipe data Parent)
        const newLine: SjPlantLine = {
            sysRowId: guidFromQr,             
            lineNum: lines.length + 1,      // Generate No Urut
            partNum: partNum,
            partDesc: partDesc,
            lotNum: lotNum,
            qty: qty,
            uom: fetchedUom, 
            warehouseCode: defaultWh, 
            availableWarehouses: fetchedWhOptions,
            binNum: defaultBin,
            availableBins: fetchedBinOptions,
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

            {/* BAGIAN 2: GRID INPUT */}
            <SJLineTable lines={lines} setLines={setLines} />

            {/* BAGIAN 3: GRID HASIL PARSING */}
            <ScanResultTable items={lines} />
        </div>
    )
}