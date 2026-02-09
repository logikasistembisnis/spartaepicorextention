type TransactionItem = {
    tanggal: string; transaksi: string; mutasi: number; satuan: string;
    documentNo: string; keterangan: string; warehouse: string;
}

const DUMMY_INCOMING: TransactionItem[] = [
    { tanggal: '2023-10-01', transaksi: 'Penerimaan Produksi', mutasi: 500, satuan: 'PCS', documentNo: 'GR-2310001', keterangan: 'Shift 1', warehouse: 'Dayeuhkolot' },
    { tanggal: '2023-10-02', transaksi: 'Retur Customer', mutasi: 10, satuan: 'PCS', documentNo: 'RT-2310005', keterangan: 'Cacat kirim', warehouse: 'Dayeuhkolot' },
];

export default function IncomingTable({ warehouse }: { warehouse: string }) {
    // useEffect(() => { fetch('/api/incoming') }, [warehouse])
    const data = DUMMY_INCOMING.filter(item => item.warehouse === warehouse);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full">
            <div className="px-6 py-4 border-b border-gray-200 bg-green-50 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-green-800">Incoming (Masuk)</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaksi</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Mutasi Masuk</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Satuan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document No</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keterangan</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.length > 0 ? (
                            data.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.tanggal}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.transaksi}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">+{item.mutasi}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{item.satuan}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.documentNo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.keterangan}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-400 italic">Data kosong.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}