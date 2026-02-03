'use client'
import { SjScanLog } from '@/types/sjPlant'

interface ScanResultTableProps {
    items: SjScanLog[];
}
export default function ScanResultTable({ items }: ScanResultTableProps) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-bold text-gray-700">Hasil Parsing Scan QR Code</h3>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase w-10">No</th>
                            <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase min-w-50">Scan QR Code</th>
                            <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase">Part Number</th>
                            <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase">Part Desc</th>
                            <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase">Lot Num</th>
                            <th className="px-3 py-3 text-center text-xs font-bold text-gray-600 uppercase">Qty</th>
                            <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase">GUID</th>
                            <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400 italic">
                                    Belum ada data.
                                </td>
                            </tr>
                        ) : (
                            items.map((item, index) => (
                                <tr key={item.guid} className="hover:bg-blue-50 transition-colors">
                                    <td className="px-3 py-2 text-xs text-gray-500">{items.length - index}</td>

                                    {/* Scan QR */}
                                    <td className="px-3 py-2 text-xs text-gray-500 truncate max-w-50" title={item.qrCode}>
                                        {item.qrCode}
                                    </td>

                                    {/* Part Num */}
                                    <td className="px-3 py-2 text-xs text-gray-500 max-w-37.5 truncate" title={item.partNum}>
                                        {item.partNum}
                                    </td>

                                    {/* Part Desc */}
                                    <td className="px-3 py-2 text-xs text-gray-500 max-w-37.5 truncate" title={item.partDesc}>
                                        {item.partDesc}
                                    </td>

                                    {/* Lot Num */}
                                    <td className="px-3 py-2 text-xs text-gray-500" title={item.lotNum}>
                                        {item.lotNum}
                                    </td>

                                    {/* Qty */}
                                    <td className="px-3 py-2 text-xs text-gray-500 text-center">
                                        {item.qty}
                                    </td>

                                    {/* GUID */}
                                    <td className="px-3 py-2 text-xs text-gray-500 max-w-37.5 truncate" title={item.guid}>
                                        {item.guid}
                                    </td>

                                    {/* Timestamp */}
                                    <td className="px-3 py-2 text-xs text-gray-500">
                                        {item.timestamp}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}