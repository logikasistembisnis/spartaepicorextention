'use client'

import { useState } from 'react'
import WarehouseFilter from '@/components/stockfg/WarehouseFilter'
import StockTable from '@/components/stockfg/StockTable'
import IncomingTable from '@/components/stockfg/IncomingTable'
import OutgoingTable from '@/components/stockfg/OutgoingTable'

export default function StockFGPage() {
    const [selectedWarehouse, setSelectedWarehouse] = useState('Dayeuhkolot');

    // Nanti Logic API Filter di sini:
    // const handleFilterChange = async (val) => {
    //    await postToApiFilter(val);
    //    setSelectedWarehouse(val); // Ini akan memicu refetch di komponen anak
    // }

    return (
        <div className="space-y-8 pb-10">
            {/* Component 1: Header & Filter */}
            <WarehouseFilter 
                selectedWarehouse={selectedWarehouse} 
                onWarehouseChange={setSelectedWarehouse} 
            />

            {/* Component 2: Tabel Stock */}
            <StockTable warehouse={selectedWarehouse} />

            {/* Component 3: Tabel Incoming */}
            <IncomingTable warehouse={selectedWarehouse} />

            {/* Component 4: Tabel Outgoing */}
            <OutgoingTable warehouse={selectedWarehouse} />
        </div>
    );
}