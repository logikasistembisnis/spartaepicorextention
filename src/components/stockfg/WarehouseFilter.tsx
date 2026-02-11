import { FunnelIcon, BuildingOfficeIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

type Props = {
    selectedWarehouse: string;
    onWarehouseChange: (value: string) => void;
}

export default function WarehouseFilter({ selectedWarehouse, onWarehouseChange }: Props) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800">Stock Finish Good</h1>

            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative group w-full md:w-64">
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
            </div>
        </div>
    )
}