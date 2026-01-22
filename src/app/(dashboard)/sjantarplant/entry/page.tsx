'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import HeaderSection from '@/components/sjantarplant/HeaderSection'
import LinesSection from '@/components/sjantarplant/LinesSection'
import { SjPlantHeader, SjPlantLine, UD100RawData } from '@/types/sjPlant'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { getPlantsList, ApiShip } from '@/api/sjplant/ship'
import { saveHeaderToUD100 } from '@/api/sjplant/addheader'
import { getHeaderById } from '@/api/sjplant/getbyid'
import { updateHeaderToUD100 } from '@/api/sjplant/updateheader'
import { addLinesToUD100, ParentKeys } from '@/api/sjplant/addlines';

function EntryContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const packNumParam = searchParams.get('id')
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [plantList, setPlantList] = useState<ApiShip[]>([]);
    const [lines, setLines] = useState<SjPlantLine[]>([]);

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
        status: 'OPEN',
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

    useEffect(() => {
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
        }

        fetchHeaderData();
    }, [packNumParam, router]);

    const handleHeaderChange = (field: keyof SjPlantHeader, value: string | boolean | number) => {
        setHeaderData(prev => ({ ...prev, [field]: value }))
    }

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
            let isHeaderSuccess = false;

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
                isHeaderSuccess = true;

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
                isHeaderSuccess = true;
            }
            if (isHeaderSuccess && currentParentKeys && lines.length > 0) {
                const linesToSave = lines;

                if (linesToSave.length > 0) {
                    const resLines = await addLinesToUD100(currentParentKeys, linesToSave);

                    if (!resLines.success) {
                        alert(`Header tersimpan (SJ: ${currentParentKeys.Key1}), TAPI Gagal Simpan Barang: ${resLines.message}`);
                    }
                }
            }
            alert("Simpan Berhasil!");

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

    // Logic untuk menentukan apakah mode Edit atau Add
    const isEditMode = !!packNumParam;
    // Logic: Lines section aktif jika sudah tersimpan (Edit Mode) atau Header punya PackNum
    const isLinesActive = isEditMode || !!headerData.packNum;

    return (
        <div className="mx-auto pb-20">
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