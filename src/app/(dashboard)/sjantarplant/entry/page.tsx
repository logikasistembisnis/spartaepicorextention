'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import HeaderSection from '@/components/sjantarplant/HeaderSection'
import LinesSection from '@/components/sjantarplant/LinesSection'
import { SjPlantHeader, SjPlantLine, UD100RawData, SjScanLog } from '@/types/sjPlant'
import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { getPlantsList, ApiShip } from '@/api/sjplant/ship'
import { saveHeaderToUD100 } from '@/api/sjplant/addheader'
import { getHeaderById } from '@/api/sjplant/getbyid'
import { updateHeaderToUD100 } from '@/api/sjplant/updateheader'
import { addLinesToUD100, ParentKeys } from '@/api/sjplant/addlines';
import { updateLineToUD100A } from '@/api/sjplant/updateline';
import { checkGuidExists } from "@/api/sjplant/checkguid";
import { InvShip } from "@/api/sjplant/invship";
import { RetInvShip } from '@/api/sjplant/retinvship'
import { pdf } from "@react-pdf/renderer";
import SuratJalanPDF from "@/components/pdf/SJAntarPlant";
import { getShipToAddress } from "@/constants/sjAddress";

function EntryContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const packNumParam = searchParams.get('id')
    const [isSaving, setIsSaving] = useState(false)
    const [isLoadingData, setIsLoadingData] = useState(false)
    const [isPostingShipped, setIsPostingShipped] = useState(false)
    const [hasPostedShipped, setHasPostedShipped] = useState(false)
    const [shipTriggeredByUser, setShipTriggeredByUser] = useState(false)
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
        isShipped: false,
        comment: '',
        status: '',
        company: '166075',
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
                router.push('/sjantarplant'); // Redirect balik jika error
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
        // DETEKSI perubahan checkbox shipped oleh USER
        if (
            field === 'isShipped' &&
            headerData.isShipped === false &&
            value === true
        ) {
            setShipTriggeredByUser(true);
        }

        // USER UNCHECK SHIP (RETURN)
        if (
            field === 'isShipped' &&
            headerData.isShipped === true &&
            value === false
        ) {
            setReturnTriggeredByUser(true);
        }

        setHeaderData(prev => ({ ...prev, [field]: value }))
    }

    useEffect(() => {
        if (
            !shipTriggeredByUser ||
            hasPostedShipped ||
            isPostingShipped ||
            !headerData.packNum
        ) return;

        if (!headerData.shipFrom || !headerData.shipTo) {
            alert("Ship From dan Ship To wajib diisi");
            setHeaderData(prev => ({ ...prev, isShipped: false }));
            setShipTriggeredByUser(false);
            return;
        }

        const handleShip = async () => {
            setIsPostingShipped(true);
            try {
                const result = await InvShip({
                    SJPlant: headerData.packNum,
                    ShipFrom: headerData.shipFrom,
                    ShipTo: headerData.shipTo,
                    Date: `${headerData.shipDate}T00:00:00`,
                });

                alert(result.output || "Inventory Transfer Success");
                setHasPostedShipped(true);
                setShipTriggeredByUser(false);

                if (rawData) {
                    await updateHeaderToUD100(
                        { ...headerData, status: "SHIPPED", isShipped: true },
                        rawData
                    );
                }

                await fetchHeaderData();

            } catch (e) {
                alert(e instanceof Error ? e.message : "Gagal");
                setHeaderData(prev => ({ ...prev, isShipped: false }));
                setShipTriggeredByUser(false);
            } finally {
                setIsPostingShipped(false);
            }
        };

        handleShip();

    }, [shipTriggeredByUser]);

    useEffect(() => {
        if (
            !returnTriggeredByUser ||
            isPostingShipped ||
            !headerData.packNum
        ) return;

        if (!headerData.shipFrom || !headerData.shipTo) {
            alert("Ship From dan Ship To wajib diisi");
            setHeaderData(prev => ({ ...prev, isShipped: true }));
            setReturnTriggeredByUser(false);
            return;
        }

        const handleReturnShip = async () => {
            setIsPostingShipped(true);
            try {
                const result = await RetInvShip({
                    SJPlant: headerData.packNum,
                    ShipFrom: headerData.shipFrom,
                    ShipTo: headerData.shipTo,
                    Date: `${headerData.shipDate}T00:00:00`,
                });

                alert(result.output || "Return Inventory Transfer Success");
                setReturnTriggeredByUser(false);
                setHasPostedShipped(false);

                if (rawData) {
                    await updateHeaderToUD100(
                        { ...headerData, status: "OPEN", isShipped: false },
                        rawData
                    );
                }

                await fetchHeaderData();

            } catch (e) {
                alert(e instanceof Error ? e.message : "Gagal return inventory");
                // rollback UI
                setHeaderData(prev => ({ ...prev, isShipped: true }));
                setReturnTriggeredByUser(false);
            } finally {
                setIsPostingShipped(false);
            }
        };

        handleReturnShip();
    }, [returnTriggeredByUser]);

    // --- LOGIC TOMBOL SIMPAN YANG DIPERBAIKI ---
    const handleSave = async () => {
        // 1. Validasi
        if (!headerData.shipFrom || !headerData.shipTo) {
            alert("Harap isi Ship From dan Ship To!");
            return;
        }

        setIsSaving(true);
        try {
            const isEditMode = !!packNumParam && !!rawData;
            let currentParentKeys: ParentKeys | null = null;

            if (isEditMode) {
                if (!rawData) {
                    alert("Data asli hilang, silakan refresh halaman.");
                    return;
                }

                // Panggil API Update
                const resHeader = await updateHeaderToUD100(headerData, rawData);
                if (!resHeader.success) {
                    throw new Error("Gagal Update Header: " + resHeader.message);
                }

                // Siapkan Key untuk Lines dari data lama
                currentParentKeys = {
                    Company: rawData.Company,
                    Key1: rawData.Key1,
                    Key2: rawData.Key2,
                    Key3: rawData.Key3,
                    Key4: rawData.Key4,
                    Key5: rawData.Key5,
                    ShipFrom: headerData.shipFrom,
                    ShipTo: headerData.shipTo
                };
            } else {
                const resHeader = await saveHeaderToUD100(headerData);
                if (!resHeader.success) {
                    throw new Error("Gagal Membuat Header: " + resHeader.message);
                }

                // Cari Data Record Baru dari Response Epicor
                const responseData = resHeader.data;
                const newRecord = responseData?.returnObj?.UD100?.[0] ||
                    responseData?.parameters?.ds?.UD100?.[0] ||
                    responseData?.ds?.UD100?.[0] ||
                    responseData?.UD100?.[0];

                if (!newRecord || !newRecord.Key1) {
                    throw new Error("Header tersimpan tapi gagal mengambil Key ID baru.");
                }

                // Siapkan Key untuk Lines dari data baru
                currentParentKeys = {
                    Company: newRecord.Company,
                    Key1: newRecord.Key1,
                    Key2: newRecord.Key2,
                    Key3: newRecord.Key3,
                    Key4: newRecord.Key4,
                    Key5: newRecord.Key5,
                    ShipFrom: headerData.shipFrom,
                    ShipTo: headerData.shipTo
                };
            }
            if (currentParentKeys && lines.length > 0) {

                const newLines = lines.filter(l => !l.rawData);
                const existingLines = lines.filter(l => !!l.rawData);

                const errorMessages: string[] = [];

                // 2. Add New Lines (Batch)
                if (newLines.length > 0) {
                    const relevantLogs = logs.filter(
                        log => log.isNew && newLines.some(nl => nl.lineNum === log.lineNum)
                    );

                    // Kumpulin semua GUID baru
                    const newGuids = logs
                        .filter(l => l.isNew && l.guid)
                        .map(l => l.guid);

                    // Cek satu-satu 
                    for (const guid of newGuids) {
                        const check = await checkGuidExists(guid);

                        if (!check.success) {
                            alert("Gagal validasi GUID");
                            return;
                        }

                        if (check.exists) {
                            alert(`QR Code dengan GUID ${guid} sudah pernah discan!`);
                            await fetchHeaderData();
                            return; // STOP TOTAL
                        }
                    }

                    const resAddLines = await addLinesToUD100(currentParentKeys, newLines, relevantLogs);
                    if (!resAddLines.success) {
                        errorMessages.push(`Gagal tambah barang baru: ${resAddLines.message}`);
                    }
                }

                // 3. Update Existing Lines (Looping)
                if (existingLines.length > 0) {
                    // Gunakan Promise.all agar update berjalan paralel (lebih cepat)
                    const updatePromises = existingLines.map(line => {
                        const newLogsForThisLine = logs.filter(
                            log => log.lineNum === line.lineNum && log.isNew
                        );
                        return updateLineToUD100A(
                            { ...line, pendingLogs: newLogsForThisLine },
                            line.rawData!
                        )
                    });

                    const results = await Promise.all(updatePromises);

                    // Cek jika ada yang gagal
                    const failed = results.filter(r => !r.success);
                    if (failed.length > 0) {
                        errorMessages.push(`Gagal update ${failed.length} baris barang.`);
                    }
                }

                if (errorMessages.length > 0) {
                    alert(`Header tersimpan, tapi ada masalah di Lines:\n${errorMessages.join('\n')}`);
                } else {
                    alert("Simpan Berhasil!");
                    window.location.reload();
                    return;
                }
            } else {
                // Header sukses, lines kosong
                alert("Simpan Berhasil!");
            }

            if (isEditMode) {
                // Jika edit mode, reload untuk refresh data (termasuk lines yg baru masuk)
                window.location.reload();
            } else if (currentParentKeys) {
                // Jika add mode, pindah ke halaman edit dengan ID baru
                router.replace(`/sjantarplant/entry?id=${currentParentKeys.Key1}`);
            }

        } catch (error: unknown) {
            console.error("Process Error:", error);

            let msg = "Terjadi kesalahan sistem.";
            if (error instanceof Error) {
                msg = error.message;
            } else if (typeof error === "string") {
                msg = error;
            }

            alert(msg);
        } finally {
            setIsSaving(false);
        }
    }

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
                    <Link href="/sjantarplant" className="text-gray-500 hover:text-blue-600">
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Link>
                    <h1 className="text-xl font-bold text-gray-800">SJ Antar Plant Entry</h1>
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
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Simpan'}
                    </button>
                    <button
                        onClick={handlePrintSuratJalan}
                        disabled={!headerData.packNum}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50"
                    >
                        Surat Jalan
                    </button>
                </div>
            </div>

            {/* Form Input Header */}
            <div className="px-4">
                <HeaderSection
                    data={headerData}
                    plantList={plantList}
                    onChange={handleHeaderChange}
                />
            </div>

            {/* Lines Section */}
            <div className={`px-4 mt-6 transition-all duration-300 ${isLinesActive ? '' : 'opacity-50 pointer-events-none grayscale'}`}>
                {isLinesActive ? (
                    <LinesSection
                        lines={lines}
                        setLines={setLines}
                        scanLogs={logs}
                        setScanLogs={setLogs}
                        shipFrom={headerData.shipFrom}
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

export default function SJAntarPlantEntryPage() {
    return (
        <Suspense fallback={<div className="p-10 text-center">Loading Page...</div>}>
            <EntryContent />
        </Suspense>
    );
}