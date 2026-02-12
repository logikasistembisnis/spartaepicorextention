'use client'

import { useEffect, useState } from 'react'
import { getIncomingData, IncomingItem } from '@/api/stokfg/getIncoming'
import { ArrowPathIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

type Props = {
    period: string;
    partNum: string;
}

export default function IncomingTable({ period, partNum }: Props) {
    const [data, setData] = useState<IncomingItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            if (!period || !partNum) {
                if (isMounted) {
                    setData([]);
                    setError(null);
                }
                return;
            }

            // Set loading hanya jika kita benar-benar akan fetch
            if (isMounted) {
                setIsLoading(true);
                setError(null);
            }

            const result = await getIncomingData(period, partNum);

            if (isMounted) {
                if (result.success && result.data) {
                    setData(result.data);
                } else {
                    setError(result.message || "Gagal mengambil detail incoming");
                    setData([]);
                }
                setIsLoading(false);
            }
        };

        fetchData();

        return () => { isMounted = false; };
    }, [period, partNum]);

    // Format Tanggal
    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const rawDate = dateString.split('T')[0];
        const [year, month, day] = rawDate.split('-');
        return `${day}/${month}/${year}`;
    };

    // Format Number Helper
    const formatNumber = (num: number | null | undefined) => {
        const value = num ?? 0;
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full flex flex-col h-fit mt-2">
            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">Incoming : </h2>
                    {partNum && <p className="text-xs text-gray-500">Part <span className="font-bold">{partNum}</span></p>}
                </div>
            </div>

            <div className="overflow-auto max-h-60 min-h-20 w-full relative">
                {isLoading ? (
                    <div className="absolute inset-0 bg-white/80 z-10 flex flex-col items-center justify-center text-gray-400">
                        <ArrowPathIcon className="h-8 w-8 animate-spin mb-2 text-orange-500" />
                        <p>Memuat rincian...</p>
                    </div>
                ) : null}

                {error ? (
                    <div className="flex flex-col items-center justify-center text-red-500 p-4">
                        <ExclamationCircleIcon className="h-8 w-8 mb-2" />
                        <p className="text-sm">{error}</p>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 shadow-sm">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaksi</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Mutasi Masuk</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Satuan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.length > 0 ? (
                                data.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">
                                            {formatDate(item.Calculated_TranDate)}
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">
                                            {item.Calculated_TranTypeDesc}
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-600">
                                            {item.Calculated_MutasiIn !== 0 ? `${formatNumber(item.Calculated_MutasiIn)}` : formatNumber(0)}
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">
                                            {item.Calculated_PartIUM}
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {item.Calculated_DocNo}
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {item.Calculated_Keterangan}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                                        {!partNum ? 'Pilih item di tabel stok untuk melihat detail.' : 'Tidak ada mutasi masuk untuk item ini.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}