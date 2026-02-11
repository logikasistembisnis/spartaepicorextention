"use server";

import { cookies } from "next/headers";
import { apiFetch } from "@/api/apiFetch";

export async function changeWarehouseCode(warehouseCode: string) {
    const cookieStore = await cookies();
    const authHeader = cookieStore.get("session_auth")?.value;

    if (!authHeader) return { success: false, message: "Unauthorized" };

    const res = await apiFetch(
        "/v2/efx/166075/UDNELChangeData/changeUdCodes",
        {
            method: "POST",
            authHeader,
            requireLicense: true,
            apiMode: "epicor",
            body: JSON.stringify({ ParamWareHouse: warehouseCode }),
        }
    );

    const data = await res.json();

    // JIKA EPICOR ERROR
    if (!res.ok) {
        return {
            success: false,
            message:
                data?.ErrorMessage ||
                data?.ErrorDetails?.[0]?.Message ||
                "Gagal mengubah kode gudang",
        };
    }

    // JIKA SUKSES (Ambil InfoMessage sesuai request)
    return {
        success: true,
        message: data?.InfoMessage || "Berhasil mengubah gudang",
    };
}