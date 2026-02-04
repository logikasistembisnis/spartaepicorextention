'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import HeaderSection from '@/components/rcvplant/HeaderSection'
import LinesSection from '@/components/rcvplant/LinesSection'
import { SjPlantHeader, SjPlantLine, UD100RawData, SjScanLog } from '@/types/sjPlant'
import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { getPlantsList, ApiShip } from '@/api/sjplant/ship'
import { getHeaderById } from '@/api/rcvplant/getbyid'
import { updateHeaderToUD100 } from '@/api/sjplant/updateheader'
import { updateLineToUD100A } from '@/api/rcvplant/updateline'
import { InvReceive } from "@/api/rcvplant/invreceive"
import { RetInvReceive } from "@/api/rcvplant/retinvreceive"
import { pdf } from "@react-pdf/renderer"
import SuratJalanPDF from "@/components/pdf/SJAntarPlant"
import { getShipToAddress } from "@/constants/sjAddress"

function RcvPlantContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const packNumParam = searchParams.get('id')
    const [isSaving, setIsSaving] = useState(false)
    const [isLoadingData, setIsLoadingData] = useState(false)
    const [isPostingReceived, setisPostingReceived] = useState(false)
    const [hasPostedReceived, setHasPostedReceived] = useState(false)
    const [rcvTriggeredByUser, setrcvTriggeredByUser] = useState(false)
    const [returnTriggeredByUser, setReturnTriggeredByUser] = useState(false)
    const [plantList, setPlantList] = useState<ApiShip[]>([])
    const [lines, setLines] = useState<SjPlantLine[]>([])
    const [logs, setLogs] = useState<SjScanLog[]>([])

    // State Header
    const [headerData, setHeaderData] = useState<SjPlantHeader>({
        packNum: '',
        shipFrom: '',
        shipTo: '',
        actualShipDate: new Date().toISOString().split('T')[0],
        shipDate: new Date().toISOString().split('T')[0],
        isTgp: false,
        isShipped: true,
        comment: '',
        status: '',
        company: '166075',
        receiptDate: '',
        isReceived: false,
        rcvComment: '',
    })

    const [rawData, setRawData] = useState<UD100RawData | null>(null);

    // Load Plant List
    useEffect(() => {
        const fetchPlants = async () => {
            const result = await getPlantsList();
            if (result.success && result.data) {
                setPlantList(result.data);
            }
        };
        fetchPlants();
    }, []);

    const fetchHeaderData = async () => {
        if (!packNumParam) return; // Jika Add New, skip

        setIsLoadingData(true);
        try {
            const result = await getHeaderById(packNumParam);

            if (result.success && result.data) {
                setHeaderData(result.data);
                if (result.rawData) {
                    setRawData(result.rawData);
                }
                if (result.lines) {
                    setLines(result.lines);
                }
                if (result.logs) {
                    setLogs(result.logs);
                }
            } else {
                alert(result.message || "Gagal mengambil data header.");
                router.push('/receiptplant'); // Redirect balik jika error
            }
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan saat memuat data.");
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        fetchHeaderData();
    }, [packNumParam, router]);

    const handleHeaderChange = (
        field: keyof SjPlantHeader,
        value: string | boolean | number
    ) => {
        // DETEKSI perubahan checkbox received oleh USER
        if (
            field === 'isReceived' &&
            headerData.isReceived === false &&
            value === true
        ) {
            setrcvTriggeredByUser(true);
        }

        // USER UNCHECK RECEIVED (RETURN)
        if (
            field === 'isReceived' &&
            headerData.isReceived === true &&
            value === false
        ) {
            setReturnTriggeredByUser(true);
        }

        setHeaderData(prev => ({ ...prev, [field]: value }))
    }

    useEffect(() => {
        if (
            !rcvTriggeredByUser ||
            hasPostedReceived ||
            isPostingReceived ||
            !headerData.packNum
        ) return;

        if (!headerData.shipFrom || !headerData.shipTo) {
            alert("Ship From dan Ship To wajib diisi");
            setHeaderData(prev => ({ ...prev, isReceived: false }));
            setrcvTriggeredByUser(false);
            return;
        }

        const handleRcv = async () => {
            setisPostingReceived(true);
            try {
                const result = await InvReceive({
                    SJPlant: headerData.packNum,
                    ShipFrom: headerData.shipFrom,
                    ShipTo: headerData.shipTo,
                    Date: `${headerData.receiptDate}T00:00:00`,
                });

                if (!result.success) {
                    alert(result.message);

                    setHeaderData(prev => ({ ...prev, isReceived: false }));
                    setrcvTriggeredByUser(false);
                    return;
                }

                alert(result.message);
                setHasPostedReceived(true);
                setrcvTriggeredByUser(false);

                if (rawData) {
                    await updateHeaderToUD100(
                        { ...headerData, status: "RECEIVED", isReceived: true },
                        rawData
                    );
                }

                await fetchHeaderData();

            } catch (e) {
                alert(e instanceof Error ? e.message : "Gagal");
                setHeaderData(prev => ({ ...prev, isReceived: false }));
                setrcvTriggeredByUser(false);
            } finally {
                setisPostingReceived(false);
            }
        };

        handleRcv();

    }, [rcvTriggeredByUser]);

    useEffect(() => {
        if (
            !returnTriggeredByUser ||
            isPostingReceived ||
            !headerData.packNum
        ) return;

        if (!headerData.shipFrom || !headerData.shipTo) {
            alert("Ship From dan Ship To wajib diisi");
            setHeaderData(prev => ({ ...prev, isReceived: true }));
            setReturnTriggeredByUser(false);
            return;
        }

        const handleReturnRcv = async () => {
            setisPostingReceived(true);
            try {
                const result = await RetInvReceive({
                    SJPlant: headerData.packNum,
                    ShipFrom: headerData.shipFrom,
                    ShipTo: headerData.shipTo,
                    Date: `${headerData.receiptDate}T00:00:00`,
                });

                if (!result.success) {
                    alert(result.message);

                    setHeaderData(prev => ({ ...prev, isReceived: true }));
                    setReturnTriggeredByUser(false);
                    return;
                }

                alert(result.message);
                setReturnTriggeredByUser(false);
                setHasPostedReceived(false);

                if (rawData) {
                    await updateHeaderToUD100(
                        { ...headerData, status: "SHIPPED", isReceived: false },
                        rawData
                    );
                }

                await fetchHeaderData();

            } catch (e) {
                alert(e instanceof Error ? e.message : "Gagal return inventory");
                // rollback UI
                setHeaderData(prev => ({ ...prev, isReceived: true }));
                setReturnTriggeredByUser(false);
            } finally {
                setisPostingReceived(false);
            }
        };

        handleReturnRcv();
    }, [returnTriggeredByUser]);

    // --- LOGIC TOMBOL SIMPAN  ---
    const handleSave = async () => {
        // 1. Validasi
        if (!headerData.receiptDate) {
            alert("Receipt Date wajib diisi!");
            return;
        }

        setIsSaving(true);
        try {
            const isEditMode = !!packNumParam && !!rawData;

            if (!rawData) {
                alert("Data asli hilang, silakan refresh halaman.");
                return;
            }

            // Panggil API Update
            const resHeader = await updateHeaderToUD100(headerData, rawData);
            if (!resHeader.success) {
                throw new Error("Gagal Update Header: " + resHeader.message);
            }

            if (lines.length > 0) {
                const errorMessages: string[] = [];

                // hanya update line yang sudah ada (punya rawData)
                const existingLines = lines.filter(l => !!l.rawData);

                if (existingLines.length > 0) {
                    const updatePromises = existingLines.map(line =>
                        updateLineToUD100A(
                            line,
                            line.rawData!
                        )
                    );

                    const results = await Promise.all(updatePromises);

                    const failed = results.filter(r => !r.success);
                    if (failed.length > 0) {
                        errorMessages.push(`Gagal update ${failed.length} baris barang.`);
                    }
                }

                if (errorMessages.length > 0) {
                    alert(
                        `Header tersimpan, tapi ada masalah di Lines:\n${errorMessages.join("\n")}`
                    );
                } else {
                    alert("Simpan Berhasil!");
                    await fetchHeaderData();
                    return;
                }
            } else {
                // header saja, tanpa lines
                alert("Simpan Berhasil!");
            }

        } catch (error: unknown) {
            console.error("Process Error:", error);

            let msg = "Terjadi kesalahan sistem.";
            if (error instanceof Error) msg = error.message;
            else if (typeof error === "string") msg = error;

            alert(msg);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrintSuratJalan = async () => {
        if (!headerData.packNum) {
            alert("Simpan data dulu sebelum cetak Surat Jalan");
            return;
        }

        if (lines.length === 0) {
            alert("Tidak ada barang untuk dicetak");
            return;
        }

        try {
            const address = getShipToAddress(headerData.shipTo);

            const blob = await pdf(
                <SuratJalanPDF
                    header={headerData}
                    lines={lines}
                    address={address}
                />
            ).toBlob();

            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");

        } catch (error) {
            console.error("Print Surat Jalan Error:", error);
            alert("Gagal membuat PDF Surat Jalan");
        }
    }

    // Logic untuk menentukan apakah mode Edit atau Add
    const isEditMode = !!packNumParam;
    // Logic: Lines section aktif jika sudah tersimpan (Edit Mode) atau Header punya PackNum
    const isLinesActive = isEditMode || !!headerData.packNum;

    return (
        <div className="relative mx-auto pb-20">
            {isLoadingData && (
                <div className="absolute inset-0 z-40 bg-gray-50 bg-opacity-70">
                    <div className="sticky top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                        <ArrowPathIcon className="h-8 w-8 text-orange-600 animate-spin" />
                        <span className="text-sm text-gray-500">Memuat data...</span>
                    </div>
                </div>
            )}

            {/* Navigasi */}
            <div className="sticky top-0 z-50 backdrop-blur-xl flex justify-between items-center mb-2 py-3">
                <div className="flex items-center gap-2">
                    <Link href="/receiptplant" className="text-gray-500 hover:text-blue-600">
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Link>
                    <h1 className="text-xl font-bold text-gray-800">Receipt Antar Plant</h1>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Clear
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || headerData.isReceived}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg
                        disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Saving...' : 'Simpan'}
                    </button>
                    <button
                        onClick={handlePrintSuratJalan}
                        disabled={!headerData.packNum}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50"
                    >
                        Penerimaan Barang
                    </button>
                </div>
            </div>

            {/* Form Input Header */}
            <div>
                <HeaderSection
                    data={headerData}
                    plantList={plantList}
                    onChange={handleHeaderChange}
                    isLocked={headerData.isReceived ?? false}
                />
            </div>

            {/* Lines Section */}
            <div className={`mt-6 transition-all duration-300 ${isLinesActive ? '' : 'opacity-50 pointer-events-none grayscale'}`}>
                {isLinesActive ? (
                    <LinesSection
                        lines={lines}
                        setLines={setLines}
                        scanLogs={logs}
                        setScanLogs={setLogs}
                        isLocked={headerData.isReceived ?? false}
                    />
                ) : (
                    <div className="p-8 bg-gray-50 rounded border-2 border-dashed border-gray-300 text-center text-gray-500">
                        Simpan Header terlebih dahulu untuk menambah barang (Lines).
                    </div>
                )}
            </div>
        </div>
    )
}

export default function RcvAntarPlantPage() {
    return (
        <Suspense fallback={<div className="p-10 text-center">Loading Page...</div>}>
            <RcvPlantContent />
        </Suspense>
    );
}