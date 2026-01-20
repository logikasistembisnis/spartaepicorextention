'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import HeaderSection from '@/components/sjantarplant/HeaderSection'
import LinesSection from '@/components/sjantarplant/LinesSection' 
import { SjPlantHeader, SjPlantLine } from '@/types/sjPlant'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { getPlantsList, ApiShip } from '@/api/sjplant/ship'
import { saveHeaderToUD100 } from '@/api/sjplant/addheader'

export default function SJAntarPlantEntry() {
    const router = useRouter()
    const [isSaving, setIsSaving] = useState(false);
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
            // 2. Panggil Server Action
            const result = await saveHeaderToUD100(headerData);

            if (result.success) {
                const responseData = result.data;
                
                // Cek 1: Ada di returnObj?
                let newRecord = responseData?.returnObj?.UD100?.[0];
                
                // Cek 2: Ada di parameters? (Kadang update method taruh disini)
                if (!newRecord) {
                    newRecord = responseData?.parameters?.ds?.UD100?.[0];
                }
                
                // Cek 3: Ada langsung di root 'ds'?
                if (!newRecord) {
                    newRecord = responseData?.ds?.UD100?.[0];
                }

                // Cek 4: Ada langsung di root 'UD100'? (Standard OData)
                if (!newRecord) {
                    newRecord = responseData?.UD100?.[0];
                }

                if (newRecord && newRecord.Key1) {
                    // Update tampilan dengan nomor yang didapat
                    setHeaderData(prev => ({ ...prev, packNum: newRecord.Key1 }));
                    alert(`Berhasil dibuat! Nomor SJ: ${newRecord.Key1}`);
                    // Optional: Redirect atau refresh
                } else {
                    console.warn("Data tersimpan tapi response structure tidak dikenali:", responseData);
                    alert("Berhasil disimpan (namun gagal membaca Nomor SJ dari response). Silakan refresh list.");
                }
            } else {
                // Jika success: false
                alert("Gagal: " + (result.message || "Terjadi kesalahan yang tidak diketahui."));
            }
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan sistem client saat menyimpan.");
        } finally {
            setIsSaving(false);
        }
    }

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
            <div className="px-4 mt-4 opacity-50 pointer-events-none grayscale">
                <div className="p-4 bg-gray-100 rounded border border-gray-300 text-center text-gray-500">
                    Simpan Header terlebih dahulu untuk menambah barang (Lines).
                </div>
            </div>
        </div>
    )
}