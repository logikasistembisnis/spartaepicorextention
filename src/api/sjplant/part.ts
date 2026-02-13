"use server";

import { cookies } from "next/headers";
import { apiFetch } from "@/api/apiFetch";

type ApiPart = {
    Part_PartNum: string;
    Part_PartDescription: string;
    Part_ClassID: string;
    Part_IUM: string;
    Part_standartpack_c: number;
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

export async function getPartsList(
    searchTerm = "",
    skip = 0,
    take = 50
): Promise<ApiResponse> {
    // Ambil Auth Token dari Cookie
    const cookieStore = await cookies();
    const authHeader = cookieStore.get("session_auth")?.value;

    if (!authHeader) {
        return { success: false, error: "Unauthorized: Silakan login kembali." };
    }

    const filterParts: string[] = [];

    if (searchTerm) {
        filterParts.push(
            `(contains(Part_PartNum,'${searchTerm}') or contains(Part_PartDescription,'${searchTerm}'))`
        );
    }

    const filterQuery =
        filterParts.length > 0 ? `&$filter=${filterParts.join(" and ")}` : "";

    try {
        const response = await apiFetch(
            `/v2/odata/166075/BaqSvc/UDNEL_PartSJPlant/Data` +
            `?$orderby=Part_PartNum asc&$top=${take}&$skip=${skip}${filterQuery}`,
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

export async function getDescbyPartNum(partNum: string): Promise<ApiResponse> {
    // Ambil Auth Token dari Cookie
    const cookieStore = await cookies();
    const authHeader = cookieStore.get("session_auth")?.value;

    if (!authHeader) {
        return { success: false, error: "Unauthorized: Silakan login kembali." };
    }

    try {
        const response = await apiFetch(
            `/v2/odata/166075/BaqSvc/UDNEL_PartSJPlant/Data?PartNum=${partNum}`,
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