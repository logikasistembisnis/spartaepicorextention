'use client'

import { useEffect, useState } from 'react'
import { getStockData, StockItem } from '@/api/stokfg/getStock'
import { ArrowPathIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

type Props = {
    warehouse: string;
    period: string;
    selectedPartNum: string;
    onSelectPart: (partNum: string) => void;
}

export default function StockTable({ warehouse, period, selectedPartNum, onSelectPart }: Props) {
    const [data, setData] = useState<StockItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleRefresh = () => {
        setRefreshKey((prev) => prev + 1);
    };

    // Format Number Helper
    const formatNumber = (num: number | null | undefined) => {
        const value = num ?? 0;
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    useEffect(() => {
        if (!warehouse || !period) return;
        let isMounted = true;

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            if (isMounted) onSelectPart('');

            const result = await getStockData(period);

            if (isMounted) {
                if (result.success && result.data) {
                    setData(result.data);
                    if (result.data.length > 0) {
                        onSelectPart(result.data[0].Calculated_PartNum);
                    }
                } else {
                    setError(result.message || "Gagal mengambil data stok");
                    setData([]);
                }
                setIsLoading(false);
            }
        };

        fetchData();
        return () => { isMounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [warehouse, period, refreshKey]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full relative flex flex-col h-full">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
                <h2 className="text-lg font-semibold text-gray-800">
                    Gudang Finish Good Stock
                </h2>
            </div>

            <div className="flex-1 relative overflow-hidden flex flex-col">
                {isLoading && (
                    <div className="absolute inset-0 z-50 bg-white/80 flex flex-col items-center justify-center text-gray-400 backdrop-blur-[1px]">
                        <ArrowPathIcon className="h-8 w-8 animate-spin mb-2 text-orange-500" />
                        <p>Memuat data stok...</p>
                    </div>
                )}

                {error ? (
                    <div className="flex flex-col items-center justify-center h-64 text-red-500 px-4 text-center">
                        <ExclamationCircleIcon className="h-10 w-10 mb-2" />
                        <p className="font-medium">{error}</p>
                        <button onClick={handleRefresh} className="mt-4 text-sm underline hover:text-red-700">Coba Lagi</button>
                    </div>
                ) : (
                    <div className="overflow-auto max-h-80 w-full">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap w-50">PartNum</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap w-70">Description</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap w-25">Saldo Awal</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap w-25">Mutasi In</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap w-25">Mutasi Out</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap w-25">Saldo Akhir</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">IUM</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Class ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap w-50">Description</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.length > 0 ? (
                                    data.map((item, idx) => {
                                        const isSelected = item.Calculated_PartNum === selectedPartNum;
                                        return (
                                            <tr
                                                key={idx}
                                                onClick={() => onSelectPart(item.Calculated_PartNum)}
                                                className={`transition-colors cursor-pointer ${isSelected
                                                    ? 'bg-blue-50 hover:bg-blue-100 border-l-4 border-l-blue-500'
                                                    : 'hover:bg-gray-50'
                                                    }`}
                                            >
                                                <td
                                                    className="px-6 py-3 text-sm font-medium text-gray-600 max-w-50 truncate"
                                                    title={item.Calculated_PartNum}
                                                >
                                                    {item.Calculated_PartNum}
                                                </td>
                                                <td
                                                    className="px-6 py-3 text-sm text-gray-600 max-w-70 truncate"
                                                    title={item.Part_PartDescription}
                                                >
                                                    {item.Part_PartDescription}
                                                </td>

                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                                                    {formatNumber(item.Calculated_SaldoAwal)}
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                                                    {item.Calculated_MutasiIn !== 0 ? `${formatNumber(item.Calculated_MutasiIn)}` : formatNumber(0)}
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                                                    {item.Calculated_MutasiOut !== 0 ? `${formatNumber(item.Calculated_MutasiOut)}` : formatNumber(0)}
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                                                    {formatNumber(item.Calculated_SaldoAkhir)}
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                                                    {item.Part_IUM}
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                                                    {item.Part_ClassID}
                                                </td>
                                                <td
                                                    className="px-6 py-3 text-sm text-gray-600 max-w-50 truncate"
                                                    title={item.PartClass_Description}
                                                >
                                                    {item.PartClass_Description}
                                                </td>
                                            </tr>
                                        )
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center text-gray-400 italic">
                                            Tidak ada data stok untuk periode {period}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}