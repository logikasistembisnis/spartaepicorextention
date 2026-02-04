"use server";

import { cookies } from "next/headers";
import { apiFetch } from "@/api/apiFetch";

type ApiPart = {
    Part_PartNum: string;
    Part_PartDescription: string;
    Part_ClassID: string;
    Part_IUM: string;
    RowIdent: string;
};

type ODataResponse = {
    "@odata.context"?: string;
    value: ApiPart[];
};

type ApiResponse = {
    success: boolean;
    data?: ApiPart[];
    error?: string;
};

export async function getPartsList(): Promise<ApiResponse> {
    // Ambil Auth Token dari Cookie
    const cookieStore = await cookies();
    const authHeader = cookieStore.get("session_auth")?.value;

    if (!authHeader) {
        return { success: false, error: "Unauthorized: Silakan login kembali." };
    }

    try {
        const response = await apiFetch(
            `/v2/odata/166075/BaqSvc/UDNEL_PartSJPlant/Data`,
            {
                method: "GET",
                authHeader,
                requireLicense: true,
                cache: "no-store",
            },
        );

        if (!response.ok) {
            return {
                success: false,
                error: `Gagal mengambil data: ${response.status} ${response.statusText}`,
            };
        }

        const result = (await response.json()) as ODataResponse;

        return { success: true, data: result.value };
    } catch (error: unknown) {
        console.error("Server Action Error:", error);

        let errorMessage = "Terjadi kesalahan server";

        if (error instanceof Error) {
            // Jika error adalah instance object Error standar
            errorMessage = error.message;
        } else if (typeof error === "string") {
            // Jika error berupa string biasa
            errorMessage = error;
        }

        return {
            success: false,
            error: errorMessage,
        };
    }
}
