"use server";

import { cookies } from "next/headers";
import { SjPlantHeader, UD100RawData } from "@/types/sjPlant";

// Helper Date
function ensureIsoDate(
    newDateStr: string,
    originalIsoString: string | null | undefined,
): string | null {
    if (!newDateStr) return null;
    if (
        originalIsoString &&
        typeof originalIsoString === "string" &&
        originalIsoString.startsWith(newDateStr)
    ) {
        return originalIsoString;
    }
    return `${newDateStr}T00:00:00`;
}

export async function updateHeaderToUD100(
    headerData: SjPlantHeader,
    rawData: UD100RawData,
) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const apiKey = process.env.API_KEY;

    if (!apiUrl || !apiKey) return { success: false, message: "Config Error" };

    const cookieStore = await cookies();
    const authSession = cookieStore.get("session_auth")?.value;

    if (!authSession) return { success: false, message: "Unauthorized" };

    try {
        // --- 1. MAPPING TYPE SAFE ---
        const updatedRow: UD100RawData = {
            ...rawData, // Spread data lama

            // Override field yang diedit
            ShortChar01: headerData.shipFrom,
            ShortChar02: headerData.shipTo,
            Character01: headerData.comment,
            CheckBox05: headerData.isTgp,
            CheckBox01: headerData.isShipped,

            // Logic Date (Pastikan null safety karena index signature bisa return undefined)
            Date01: ensureIsoDate(
                headerData.actualShipDate,
                rawData.Date01 as string | null,
            ),
            Date02: ensureIsoDate(
                headerData.shipDate,
                rawData.Date02 as string | null,
            ),

            RowMod: "U",
        };

        const payload = {
            ds: {
                UD100: [updatedRow],
            },
        };

        const endpoint = `${apiUrl}/v1/Ice.BO.UD100Svc/Update`;
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                Authorization: authSession,
            },
            body: JSON.stringify(payload),
            cache: "no-store",
        });

        if (!response.ok) {
            return {
                success: false,
                message: `Gagal Update: ${response.status} ${response.statusText}`,
            };
        }

        const result = await response.json();
        return { success: true, data: result };
    } catch (error) {
        console.error("Update Header Error:", error);
        return { success: false, message: "Terjadi kesalahan sistem server." };
    }
}
