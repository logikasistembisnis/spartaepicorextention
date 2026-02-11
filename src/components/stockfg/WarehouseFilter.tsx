import { ArrowPathIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'
import { ChevronDownIcon } from '@heroicons/react/20/solid'

type Props = {
    selectedWarehouse: string;
    onWarehouseChange: (value: string) => void;
    selectedPeriod: string;
    onPeriodChange: (value: string) => void;
    isLoading: boolean;
}

export default function WarehouseFilter({
    selectedWarehouse,
    onWarehouseChange,
    selectedPeriod,
    onPeriodChange,
    isLoading
}: Props) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800">Stock Finish Good</h1>

            <div className="flex items-center gap-3 w-full md:w-auto">

                {/* 1. WAREHOUSE SELECT */}
                <div className="relative w-full md:w-64">
                    <select
                        value={selectedWarehouse}
                        onChange={(e) => onWarehouseChange(e.target.value)}
                        disabled={isLoading}
                        className={`w-full appearance-none rounded-lg border-0 ring-1 ring-inset py-2 pl-3 pr-10 text-sm focus:ring-1 sm:leading-6 cursor-pointer shadow-sm
                        ${isLoading
                                ? 'bg-gray-100 text-gray-400 ring-gray-200 cursor-wait'
                                : 'bg-white text-gray-900 ring-gray-300'
                            }`}
                    >
                        <option value="" disabled>Pilih Gudang</option>
                        <option value="Dayeuhkolot">Gudang Dayeuhkolot</option>
                        <option value="Soreang">Gudang Soreang</option>
                        <option value="Karawang">Gudang Karawang</option>
                    </select>

                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        {isLoading ? (
                            <ArrowPathIcon className="h-4 w-4 text-orange-500 animate-spin" aria-hidden="true" />
                        ) : (
                            <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        )}
                    </div>
                </div>

                {/* 2. PERIOD INPUT */}
                <div className="relative w-full sm:w-40">
                    {/* Label Statis "Periode :" */}
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-gray-500 sm:text-sm font-medium">Periode :</span>
                    </div>
                    
                    {/* Input Field (Padding Kiri disesuaikan agar tidak menimpa label) */}
                    <input
                        type="text"
                        value={selectedPeriod}
                        onChange={(e) => {
                            // Validasi: Hanya angka, max 4 digit
                            const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                            onPeriodChange(val);
                        }}
                        disabled={isLoading}
                        placeholder="YYMM" // misal 2602
                        className={`block w-full rounded-lg border-0 py-2 pl-[4.8rem] pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 shadow-sm
                        ${isLoading 
                            ? 'bg-gray-100 cursor-wait' 
                            : 'bg-white'
                        }`}
                    />
                </div>

            </div>
        </div>
    )
}