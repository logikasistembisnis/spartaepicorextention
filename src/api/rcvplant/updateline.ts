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
        const validQty = Number(lineData.qtyHitungPcs) || 0;
        const packQty = Number(lineData.qtyPack) || 0;
        const ud100aList: UD100ARawData[] = [];
        ud100aList.push({
            ...rawData, // Copy semua Key & data lama
            Character03: lineData.binTo, // Update Warehouse
            Character02: lineData.rcvComment, // Update Bin
            ShortChar08: lineData.whTo, // Update Comment
            Number02: validQty, // Update Total Qty
            Number03: packQty,
            RowMod: "U", // 'U' = Update existing record
        });

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
