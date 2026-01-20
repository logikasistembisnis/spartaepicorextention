'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import HeaderSection from '@/components/sjantarplant/HeaderSection'
import LinesSection from '@/components/sjantarplant/LinesSection'
import { SjPlantHeader, SjPlantLine, UD100RawData } from '@/types/sjPlant'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { getPlantsList, ApiShip } from '@/api/sjplant/ship'
import { saveHeaderToUD100 } from '@/api/sjplant/addheader'
import { getHeaderById } from '@/api/sjplant/getbyid'
import { updateHeaderToUD100 } from '@/api/sjplant/update'

export default function SJAntarPlantEntry() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const packNumParam = searchParams.get('id')
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [plantList, setPlantList] = useState<ApiShip[]>([]);

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

            if (isEditMode) {
                if (!rawData) {
                    alert("Data asli hilang, silakan refresh halaman.");
                    return;
                }

                // Panggil API Update
                const result = await updateHeaderToUD100(headerData, rawData);

                if (result.success) {
                    alert("Data berhasil diperbarui!");
                    // Refresh halaman agar mendapatkan SysRevID terbaru
                    window.location.reload();
                } else {
                    alert("Gagal Update: " + (result.message || "Kesalahan tidak diketahui"));
                }

            } else {

                const result = await saveHeaderToUD100(headerData);

                if (result.success) {
                    const responseData = result.data;

                    // Logic mencari ID baru dari response Epicor yang strukturnya dinamis
                    const newRecord = responseData?.returnObj?.UD100?.[0] ||
                        responseData?.parameters?.ds?.UD100?.[0] ||
                        responseData?.ds?.UD100?.[0] ||
                        responseData?.UD100?.[0];

                    if (newRecord && newRecord.Key1) {
                        // Update UI & URL
                        setHeaderData(prev => ({ ...prev, packNum: newRecord.Key1 }));
                        alert(`Berhasil dibuat! Nomor SJ: ${newRecord.Key1}`);

                        // Pindah ke mode edit
                        router.replace(`/sjantarplant/entry?id=${newRecord.Key1}`);
                    } else {
                        alert("Berhasil disimpan, namun gagal membaca Nomor SJ. Silakan cek list.");
                        router.push('/sjantarplant');
                    }
                } else {
                    alert("Gagal Simpan: " + (result.message || "Kesalahan tidak diketahui"));
                }
            }

        } catch (error) {
            console.error("Save Error:", error);
            alert("Terjadi kesalahan sistem client saat menyimpan.");
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
            <div className={`px-4 mt-4 transition-all duration-300 ${isLinesActive ? '' : 'opacity-50 pointer-events-none grayscale'}`}>
                {isLinesActive ? (
                    <div className="p-4 bg-white rounded border border-gray-200">
                        {/* <LinesSection headerId={headerData.packNum} /> */}
                    </div>
                ) : (
                    <div className="p-4 bg-gray-100 rounded border border-gray-300 text-center text-gray-500">
                        Simpan Header terlebih dahulu untuk menambah barang (Lines).
                    </div>
                )}
            </div>
        </div>
    )
}