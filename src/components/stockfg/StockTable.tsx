'use client'

import { useEffect, useState } from 'react'
import { getStockData, StockItem } from '@/api/stokfg/getStock'
import { ArrowPathIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

type Props = {
    warehouse: string;
    period: string;
}

export default function StockTable({ warehouse, period }: Props) {
    const [data, setData] = useState<StockItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleRefresh = () => {
        setRefreshKey((prev) => prev + 1);
    };

    useEffect(() => {
        if (!warehouse || !period) return;
        let isMounted = true;

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            const result = await getStockData(period);
            
            if (isMounted) {
                if (result.success && result.data) {
                    setData(result.data);
                } else {
                    setError(result.message || "Gagal mengambil data stok");
                    setData([]);
                }
                setIsLoading(false);
            }
        };

        fetchData();
        return () => { isMounted = false; };
    }, [warehouse, period, refreshKey]);

    const formatNumber = (num: number | null | undefined) => {
        // Jika null/undefined, dianggap 0
        const value = num ?? 0; 
        
        // 'en-US' untuk pemisah titik (0.00)
        return new Intl.NumberFormat('en-US', { 
            minimumFractionDigits: 2, // Memaksa minimal 2 desimal (0 -> 0.00)
            maximumFractionDigits: 2  // Membatasi maksimal 2 desimal
        }).format(value);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full relative flex flex-col h-full">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
                <h2 className="text-lg font-semibold text-gray-800">
                    Gudang Finish Good Stock
                </h2>
            </div>

            {/* 2. Content Area */}
            {isLoading && data.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <ArrowPathIcon className="h-8 w-8 animate-spin mb-2 text-orange-500" />
                    <p>Memuat data stok...</p>
                </div>
            ) : error ? (
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">PartNum</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Description</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Saldo Awal</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Mutasi In</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Mutasi Out</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Saldo Akhir</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">IUM</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Class ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Description</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.length > 0 ? (
                                data.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">
                                            {item.Calculated_PartNum}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {item.Part_PartDescription}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                                            {formatNumber(item.Calculated_SaldoAwal)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                                            {item.Calculated_MutasiIn !== 0 
                                                ? `+${formatNumber(item.Calculated_MutasiIn)}` 
                                                : formatNumber(0) 
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                                            {item.Calculated_MutasiOut !== 0 
                                                ? `-${formatNumber(item.Calculated_MutasiOut)}` 
                                                : formatNumber(0)
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                                            {formatNumber(item.Calculated_SaldoAkhir)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                                            {item.Part_IUM}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                                            {item.Part_ClassID}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {item.PartClass_Description}
                                        </td>
                                    </tr>
                                ))
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

            {/* Loading Overlay */}
            {isLoading && data.length > 0 && (
                <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center">
                    <ArrowPathIcon className="h-8 w-8 animate-spin text-orange-500" />
                </div>
            )}
        </div>
    )
}