import { FunnelIcon, BuildingOfficeIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

type Props = {
    selectedWarehouse: string;
    onWarehouseChange: (value: string) => void;
}

export default function WarehouseFilter({ selectedWarehouse, onWarehouseChange }: Props) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <BuildingOfficeIcon className="h-7 w-7 text-orange-600" />
                    Stock Finish Good
                </h1>
                <p className="text-gray-500 text-sm mt-1">Monitoring stok gudang, barang masuk, dan barang keluar.</p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative group w-full md:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FunnelIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                        value={selectedWarehouse}
                        onChange={(e) => onWarehouseChange(e.target.value)}
                        className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-lg border bg-gray-50 cursor-pointer"
                    >
                        <option value="Dayeuhkolot">Gudang Dayeuhkolot</option>
                        <option value="Soreang">Gudang Soreang</option>
                        <option value="Karawang">Gudang Karawang</option>
                    </select>
                </div>
                <button className="p-2 text-gray-400 hover:text-orange-600 transition-colors" title="Refresh Data">
                    <ArrowPathIcon className="h-5 w-5" />
                </button>
            </div>
        </div>
    )
}