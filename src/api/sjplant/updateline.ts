"use server";

import { cookies } from "next/headers";
import { SjPlantLine, UD100ARawData } from "@/types/sjPlant";
import { apiFetch } from "@/api/apiFetch";

export async function updateLineToUD100A(
    lineData: SjPlantLine,
    rawData: UD100ARawData,
) {
    const cookieStore = await cookies();
    const authHeader = cookieStore.get("session_auth")?.value;

    if (!authHeader) return { success: false, message: "Unauthorized" };

    try {
        const validQty = Number(lineData.qty) || 0;
        const ud100aList: UD100ARawData[] = [];
        ud100aList.push({
            ...rawData, // Copy semua Key & data lama
            ShortChar03: lineData.warehouseCode, // Update Warehouse
            ShortChar05: lineData.binNum, // Update Bin
            ShortChar06: lineData.comment, // Update Comment
            Number01: validQty, // Update Total Qty
            RowMod: "U", // 'U' = Update existing record
        });

        if (lineData.pendingLogs && lineData.pendingLogs.length > 0) {
            lineData.pendingLogs.forEach((log) => {
                ud100aList.push({
                    // --- PARENT KEYS (Wajib sama dengan induk) ---
                    Company: rawData.Company,
                    Key1: rawData.Key1,
                    Key2: rawData.Key2,
                    Key3: rawData.Key3,
                    Key4: rawData.Key4,
                    Key5: rawData.Key5,
                    ChildKey1: log.lineNum.toString(),
                    ChildKey2: "",
                    ChildKey3: "",
                    ChildKey4: "",
                    ChildKey5: "SJPlant#QRCode",
                    Character01: log.qrCode, // Raw QR Code string
                    Character02: log.partDesc, // Deskripsi Barang
                    Character03: log.guid, // GUID (disimpan di kolom data biasa)
                    ShortChar01: log.partNum,
                    ShortChar02: log.lotNum,
                    ShortChar03: log.timestamp, // Waktu scan
                    Number01: Number(log.qty) || 0,
                    RowMod: "A",
                });
            });
        }

        const payload = {
            ds: {
                UD100A: ud100aList,
            },
        };

        // --- 3. CALL API ---
        const endpoint = `/v1/Ice.BO.UD100Svc/Update`;
        const response = await apiFetch(endpoint, {
            method: "POST",
            authHeader,
            requireLicense: true,
            body: JSON.stringify(payload),
            cache: "no-store",
        });

        if (!response.ok) {
            // Coba baca error detail dari Epicor jika ada
            const errorText = await response.text();
            console.error("Epicor Error:", errorText);
            return {
                success: false,
                message: `Gagal Update Line: ${response.statusText}`,
            };
        }

        const result = await response.json();
        return { success: true, data: result };
    } catch (error) {
        console.error("Update Line Error:", error);
        return { success: false, message: "Terjadi kesalahan sistem server." };
    }
}
