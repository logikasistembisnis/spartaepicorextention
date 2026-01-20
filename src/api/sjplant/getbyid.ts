"use server";

import { cookies } from "next/headers";
import { SjPlantHeader } from "@/types/sjPlant";

export async function getHeaderById(packNum: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const apiKey = process.env.API_KEY;

    if (!apiUrl || !apiKey) return { success: false, message: "Config Error" };

    const cookieStore = await cookies();
    const authSession = cookieStore.get("session_auth")?.value;

    if (!authSession) return { success: false, message: "Unauthorized" };

    try {
        const queryParams = new URLSearchParams({
            key1: packNum,
            key2: "",
            key3: "",
            key4: "",
            key5: "SJPlant",
        });

        const queryUrl = `${apiUrl}/v1/Ice.BO.UD100Svc/GetByID?${queryParams.toString()}`;

        const response = await fetch(queryUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                Authorization: authSession,
            },
            cache: "no-store",
        });

        if (!response.ok) {
            return {
                success: false,
                message: `Gagal mengambil data: ${response.statusText}`,
            };
        }

        const result = await response.json();

        if (
            !result.returnObj ||
            !result.returnObj.UD100 ||
            result.returnObj.UD100.length === 0
        ) {
            return { success: false, message: "Data tidak ditemukan." };
        }

        const raw = result.returnObj.UD100[0];

        // --- MAPPING DATA ---
        const headerData: SjPlantHeader = {
            packNum: raw.Key1,
            shipFrom: raw.ShortChar01 || "",
            shipTo: raw.ShortChar02 || "",
            // Date01: "2026-01-19T00:00:00" -> ambil tanggalnya saja
            actualShipDate: raw.Date01 ? raw.Date01.split("T")[0] : "",
            isTgp: raw.CheckBox05 || false,
            comment: raw.Character01 || "",
            isShipped: raw.CheckBox01 || false,
            shipDate: raw.Date02 ? raw.Date02.split("T")[0] : "",
            status: raw.ShortChar06 || "OPEN",
            company: raw.Company,
            sysRowID: raw.SysRowID,
            sysRevID: raw.SysRevID,
            bitFlag: raw.BitFlag,
            rowMod: "U",
        };

        return { success: true, data: headerData };
    } catch (error) {
        console.error("Get Header Error:", error);
        return { success: false, message: "Terjadi kesalahan server." };
    }
}
