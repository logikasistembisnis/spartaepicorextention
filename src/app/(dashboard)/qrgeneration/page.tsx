'use client'

import { useState, useEffect, useCallback } from 'react'
import { TrashIcon, PlusIcon, PrinterIcon, ArrowPathIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import AddNew from '@/components/modals/qrgen/AddNew'
import { getGeneratedQRList, qrList, deleteQRItem } from '@/api/qrlist'
import { updateUD14, UpdateUD14Item } from '@/api/updateqrcode'
import QRCode from 'qrcode';
import { pdf } from '@react-pdf/renderer'
import { QrPdfDocument, QrPdfItem } from '@/components/pdf/QrPdfDocument'
import EditQty from '@/components/modals/qrgen/EditQty'

type PartItem = {
    company: string
    id: string
    partNumber: string
    description: string
    lotNumber: string
    qtyBox: number
    qtyCetak: number
    key5: string
    sysRowId: string
    sysRevId: number
    timePrint: string
    entryPerson: string
    entryDate: string
}

// Helper: Generate Random UUID
const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID(); // Modern browser
    }
    // Fallback untuk browser lama
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Helper: Generate Timestamp yymmddHHmmss
const generateTimestamp = () => {
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const MM = (now.getMonth() + 1).toString().padStart(2, "0");
    const dd = now.getDate().toString().padStart(2, "0");
    const HH = now.getHours().toString().padStart(2, "0");
    const mm = now.getMinutes().toString().padStart(2, "0");
    const ss = now.getSeconds().toString().padStart(2, "0");
    return `${yy}${MM}${dd}${HH}${mm}${ss}`;
}

export default function QrGeneration() {
    const [items, setItems] = useState<PartItem[]>([])
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [isPrinting, setIsPrinting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<PartItem | null>(null)
    const [newQty, setNewQty] = useState<number>(0)
    const [newQtyCetak, setNewQtyCetak] = useState<number>(0)
    const [isSavingEdit, setIsSavingEdit] = useState(false)

    const fetchQRData = useCallback(async () => {
        setLoading(true)
        setError(null)
        setSelectedIds(new Set())

        try {
            const res = await getGeneratedQRList()

            if (res.success && res.data) {
                const mappedData: PartItem[] = res.data.map((item: qrList) => ({
                    company: item.UD14_Company,
                    id: item.UD14_Key1,
                    partNumber: item.UD14_Key2,
                    description: item.UD14_Character01,
                    lotNumber: item.UD14_ShortChar02,
                    qtyBox: item.UD14_Number01,
                    qtyCetak: item.UD14_Number02,
                    key5: item.UD14_Key5,
                    sysRowId: item.UD14_SysRowID,
                    sysRevId: item.UD14_SysRevID,
                    timePrint: item.UD14_ShortChar01,
                    entryPerson: item.UD14_ShortChar20,
                    entryDate: item.UD14_Date01
                }))

                setItems(mappedData)
            } else {
                setError("Gagal memuat data dari server.")
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError("Terjadi kesalahan jaringan.")
            }
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchQRData()
    }, [fetchQRData])

    // CheckBox
    // Select All
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allIds = new Set(items.map(i => i.id));
            setSelectedIds(allIds);
        } else {
            setSelectedIds(new Set());
        }
    }

    // Select Single Row
    const handleSelectOne = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    }

    // Cek status checkbox header (Indeterminate logic bisa ditambahkan jika perlu, ini simple version)
    const isAllSelected = items.length > 0 && selectedIds.size === items.length;

    // --- LOGIC PRINT ---
    const handlePrint = async () => {
        if (selectedIds.size === 0) {
            alert("Pilih setidaknya satu item untuk di-print.");
            return;
        }

        setIsPrinting(true);

        try {
            // Ambil item yang diceklis
            const selectedItems = items.filter(item => selectedIds.has(item.id));

            // GENERATE GAMBAR QR CODE
            const itemsToPrintNested = await Promise.all(
                selectedItems.map(async (item) => {
                    // Tentukan jumlah loop berdasarkan Qty Cetak
                    const printCount = item.qtyCetak && item.qtyCetak > 0 ? item.qtyCetak : 1;

                    const generatedBatch = await Promise.all(
                        Array.from({ length: printCount }).map(async (_, index) => {

                            // GENERATE ID UNIK
                            const uniqueQRId = generateUUID();

                            // Format: partnumber#partdesc#lotnumber#qtybox#UNIQUE_ID
                            const rawData = `${item.partNumber}#${item.description}#${item.lotNumber}#${item.qtyBox}#${uniqueQRId}`;

                            // Buat Gambar Base64
                            const qrBase64 = await QRCode.toDataURL(rawData, {
                                errorCorrectionLevel: 'M',
                                margin: 1,
                                width: 300,
                                color: { dark: '#000000', light: '#ffffff' }
                            });

                            return {
                                partNumber: item.partNumber,
                                description: item.description,
                                lotNumber: item.lotNumber,
                                qtyBox: item.qtyBox,
                                qtyCetak: item.qtyCetak,
                                sysRowId: uniqueQRId,
                                qrImageSrc: qrBase64
                            };
                        })
                    );

                    return generatedBatch;
                })
            );

            const itemsToPrint: QrPdfItem[] = itemsToPrintNested.flat();

            // Generate PDF Blob dengan data yang sudah ada gambarnya
            const blob = await pdf(<QrPdfDocument items={itemsToPrint} />).toBlob();

            // Buka di Tab Baru
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');

            // Update Time Print
            const timestamp = generateTimestamp();

            const updatePayload: UpdateUD14Item[] = selectedItems.map(item => ({
                Company: item.company,
                Key1: item.id,
                Key2: item.partNumber,
                Key5: item.key5,
                SysRowID: item.sysRowId,
                SysRevID: item.sysRevId,
                ShortChar01: item.timePrint ? item.timePrint : timestamp,
                ShortChar02: item.lotNumber,
                Character01: item.description,
                Number01: item.qtyBox,
                Number02: item.qtyCetak,
                ShortChar20: item.entryPerson,
                Date01: item.entryDate
            }));

            const updateResult = await updateUD14(updatePayload);

            if (updateResult.success) {
                // Refresh data
                await fetchQRData();
            } else {
                alert(`PDF tercetak, tapi gagal update status di server: ${updateResult.message}`);
            }

        } catch (err) {
            console.error("Print error:", err);
            alert("Gagal membuat QR Code atau PDF.");
        } finally {
            setIsPrinting(false);
        }
    };

    const handleEditClick = (item: PartItem) => {
        setEditingItem(item);
        setNewQty(item.qtyBox);
        setNewQtyCetak(item.qtyCetak);
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingItem) return;

        setIsSavingEdit(true);
        try {
            const payload: UpdateUD14Item[] = [{
                Company: editingItem.company,
                Key1: editingItem.id,
                Key2: editingItem.partNumber,
                Key5: editingItem.key5,
                SysRowID: editingItem.sysRowId,
                SysRevID: editingItem.sysRevId,
                Number01: newQty,
                Character01: editingItem.description,
                ShortChar20: editingItem.entryPerson,
                ShortChar02: editingItem.lotNumber,
                ShortChar01: editingItem.timePrint,
                Number02: newQtyCetak,
                Date01: editingItem.entryDate
            }];

            const result = await updateUD14(payload);

            if (result.success) {
                setIsEditModalOpen(false);
                setEditingItem(null);
                fetchQRData(); // Refresh data
            } else {
                alert(`Gagal update qty: ${result.message}`);
            }
        } catch (error) {
            alert("Terjadi kesalahan saat menyimpan.");
        } finally {
            setIsSavingEdit(false);
        }
    };


    // Handle Delete Baris
    const handleDelete = async (itemToDelete: PartItem) => {
        if (!window.confirm(`Yakin ingin menghapus PartNum ${itemToDelete.partNumber}, Qty Box ${itemToDelete.qtyBox}?`)) return;

        const previousItems = [...items];
        setItems(items.filter(item => item.id !== itemToDelete.id));
        if (selectedIds.has(itemToDelete.id)) {
            const newSelected = new Set(selectedIds);
            newSelected.delete(itemToDelete.id);
            setSelectedIds(newSelected);
        }

        const result = await deleteQRItem(
            itemToDelete.id,         // Key1
            itemToDelete.partNumber, // Key2
            '',                      // Key3
            '',                      // Key4
            itemToDelete.key5        // Key5
        );

        if (!result.success) {
            // Rollback jika gagal
            setItems(previousItems);
            alert(`Gagal menghapus: ${result.message || 'Error tidak diketahui'}`);
        }
    }

    const handleRefreshAfterAdd = () => {
        setIsModalOpen(false)
        fetchQRData() // Ambil data terbaru dari server
    }

    return (
        <div className="space-y-6">
            {/* Header Page */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800">Generated QR Code</h2>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handlePrint}
                        disabled={isPrinting || selectedIds.size === 0}
                        className={`flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all
                            ${(isPrinting || selectedIds.size === 0) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}
                        `}
                    >
                        {isPrinting ? (
                            <ArrowPathIcon className="h-5 w-5 animate-spin" />
                        ) : (
                            <PrinterIcon className="h-5 w-5" />
                        )}
                        {isPrinting ? 'Printing...' : 'Print'}
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center gap-1 md:gap-2 bg-orange-600 hover:bg-orange-700 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors shadow-sm"
                    >
                        <PlusIcon className="h-4 md:h-5 w-5 text-white" />
                        Add New
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden grow relative flex flex-col max-h-[65vh]">
                {loading && (
                    <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
                        <div className="flex flex-col items-center">
                            <ArrowPathIcon className="h-5 md:h-8 w-8 text-orange-500 animate-spin mb-2" />
                            <span className="text-xs md:text-sm text-gray-500">Memuat data...</span>
                        </div>
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-4 py-4 w-12 text-center bg-gray-50">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                        checked={isAllSelected}
                                        onChange={handleSelectAll}
                                        disabled={loading || items.length === 0}
                                    />
                                </th>
                                <th className="px-4 md:px-6 py-2 md:py-4 text-center text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wider">No</th>
                                <th className="px-4 md:px-6 py-2 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wider">Part Number</th>
                                <th className="px-4 md:px-6 py-2 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-4 md:px-6 py-2 md:py-4 text-center text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wider">Lot Number</th>
                                <th className="px-4 md:px-6 py-2 md:py-4 text-center text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wider">Qty Box</th>
                                <th className="px-4 md:px-6 py-2 md:py-4 text-center text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wider">Qty Cetak</th>
                                <th className="px-4 md:px-6 py-2 md:py-4 text-center text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {!loading && items.length > 0 ? (
                                items.map((item, index) => {
                                    const isSelected = selectedIds.has(item.id);
                                    const isPrinted = !!item.timePrint;
                                    return (
                                        <tr
                                            key={item.id}
                                            className={`transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                            onClick={() => handleSelectOne(item.id)}
                                        >
                                            <td className="px-4 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectOne(item.id)}
                                                />
                                            </td>
                                            <td className="px-4 md:px-6 py-2 whitespace-nowrap text-xs md:text-sm text-gray-900 text-center">{index + 1}</td>
                                            <td className="px-4 md:px-6 py-2 whitespace-nowrap text-xs md:text-sm text-gray-900">{item.partNumber}</td>
                                            <td className="px-4 md:px-6 py-2 whitespace-nowrap text-xs md:text-sm text-gray-900">{item.description}</td>
                                            <td className="px-4 md:px-6 py-2 whitespace-nowrap text-xs md:text-sm text-gray-900 text-center">{item.lotNumber}</td>
                                            <td className="px-4 md:px-6 py-2 whitespace-nowrap text-xs md:text-sm text-gray-900 text-center">{item.qtyBox}</td>
                                            <td className="px-4 md:px-6 py-2 whitespace-nowrap text-xs md:text-sm text-gray-900 text-center">{item.qtyCetak}</td>
                                            <td className="px-4 md:px-6 py-2 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {/* TOMBOL EDIT */}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleEditClick(item); }}
                                                        className="text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50"
                                                        title="Edit Qty"
                                                    >
                                                        <PencilSquareIcon className="h-5 w-5" />
                                                    </button>

                                                    {/* TOMBOL DELETE */}
                                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(item); }} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50">
                                                        <TrashIcon className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : !loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400">Data Kosong</td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddNew
                isOpen={isModalOpen}
                onCloseAction={() => setIsModalOpen(false)}
                onSaveAction={() => handleRefreshAfterAdd()}
            />

            <EditQty
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false)
                    setEditingItem(null)
                }}
                onSave={handleSaveEdit}
                partNumber={editingItem?.partNumber || ''}
                currentQty={newQty}
                setNewQty={setNewQty}
                currentQtyCetak={newQtyCetak}
                setNewQtyCetak={setNewQtyCetak}
                isSaving={isSavingEdit}
                isPrinted={!!editingItem?.timePrint}
            />
        </div>
    )
}