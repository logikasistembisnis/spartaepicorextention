// Type Definition Local (atau import dari types.ts)
type StockItem = {
    partNum: string; description: string; saldoAwal: number; mutasiIn: number;
    mutasiOut: number; saldoAkhir: number; ium: string; classId: string;
    classDescription: string; warehouse: string;
}

// DUMMY DATA (Dipindah ke sini agar isolated)
const DUMMY_STOCK: StockItem[] = [
    { partNum: 'FG-001', description: 'Box Karton 20x20', saldoAwal: 1000, mutasiIn: 500, mutasiOut: 200, saldoAkhir: 1300, ium: 'PCS', classId: 'BOX', classDescription: 'Finish Good Box', warehouse: 'Dayeuhkolot' },
    { partNum: 'FG-002', description: 'Plastic Wrap Roll', saldoAwal: 50, mutasiIn: 10, mutasiOut: 5, saldoAkhir: 55, ium: 'ROLL', classId: 'PLASTIC', classDescription: 'Packaging Material', warehouse: 'Dayeuhkolot' },
    { partNum: 'FG-003', description: 'Label Sticker A', saldoAwal: 5000, mutasiIn: 0, mutasiOut: 1000, saldoAkhir: 4000, ium: 'SHEET', classId: 'LBL', classDescription: 'Accessories', warehouse: 'Soreang' },
];

export default function StockTable({ warehouse }: { warehouse: string }) {
    // Simulasi Filter / Fetch Data
    // useEffect(() => { fetch('/api/stock') }, [warehouse])
    const data = DUMMY_STOCK.filter(item => item.warehouse === warehouse);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Gudang Finish Good Stock</h2>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-blue-100 text-blue-800">
                    Total Items: {data.length}
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PartNum</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo Awal</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-green-600 uppercase tracking-wider">Mutasi In</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-red-600 uppercase tracking-wider">Mutasi Out</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-blue-600 uppercase tracking-wider">Saldo Akhir</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">IUM</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Class ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class Desc</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.length > 0 ? (
                            data.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.partNum}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">{item.saldoAwal}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">+{item.mutasiIn}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">-{item.mutasiOut}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-blue-700">{item.saldoAkhir}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{item.ium}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{item.classId}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.classDescription}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={9} className="px-6 py-10 text-center text-gray-400 italic">No Data</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}