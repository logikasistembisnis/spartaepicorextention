'use client'

import { useState } from 'react'
import WarehouseFilter from '@/components/stockfg/WarehouseFilter'
import StockTable from '@/components/stockfg/StockTable'
import IncomingTable from '@/components/stockfg/IncomingTable'
import OutgoingTable from '@/components/stockfg/OutgoingTable'
import { changeWarehouseCode } from '@/api/stokfg/changeWh'

const WAREHOUSE_MAP: Record<string, string> = {
    'Dayeuhkolot': '#FG#',
    'Karawang': '#FG-KRW#',
    'Soreang': '#FG-SRG#'
};

// Helper function untuk get format YYMM (misal: 2602)
const getCurrentPeriod = () => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2); // Ambil 2 digit terakhir tahun
    const mm = String(now.getMonth() + 1).padStart(2, '0'); // Ambil bulan (0-11) + 1, lalu pad 0 di depan
    return `${yy}${mm}`;
}

export default function StockFGPage() {
    const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
    const [selectedPeriod, setSelectedPeriod] = useState<string>(getCurrentPeriod());
    const [isLoading, setIsLoading] = useState(false);

    const handleWarehouseChange = async (uiValue: string) => {
        // Jika user memilih "Pilih Gudang" (value kosong), reset state
        if (!uiValue) {
            setSelectedWarehouse('');
            return;
        }

        setIsLoading(true);

        try {
            // Ambil kode API berdasarkan pilihan user
            const apiParam = WAREHOUSE_MAP[uiValue];

            if (!apiParam) {
                alert("Kode gudang tidak ditemukan");
                return;
            }

            // Panggil API
            const result = await changeWarehouseCode(apiParam);

            if (result.success) {
                setSelectedWarehouse(uiValue);
            } else {
                alert(`Gagal: ${result.message}`);
            }
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan jaringan.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Component 1: Header & Filter */}
            <WarehouseFilter
                selectedWarehouse={selectedWarehouse}
                onWarehouseChange={handleWarehouseChange}
                selectedPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
                isLoading={isLoading}
            />

            {selectedWarehouse ? (
                <div className={`space-y-4 transition-opacity duration-300 ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                    {/* Component 2: Tabel Stock */}
                    <StockTable
                        warehouse={selectedWarehouse}
                        period={selectedPeriod}
                    />

                    {/* Component 3: Tabel Incoming */}
                    <IncomingTable warehouse={selectedWarehouse} />

                    {/* Component 4: Tabel Outgoing */}
                    <OutgoingTable warehouse={selectedWarehouse} />
                </div>
            ) : (
                // Tampilan Placeholder jika belum pilih gudang
                <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <p className="text-gray-500 font-medium">Silakan pilih gudang terlebih dahulu untuk melihat data.</p>
                </div>
            )}
        </div>
    );
}