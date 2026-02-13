"use server";

import { cookies } from "next/headers";
import { apiFetch } from "@/api/apiFetch";

// Definisikan Tipe Data
export type StockItem = {
    Calculated_PartNum: string;
    Part_PartDescription: string;
    Calculated_SaldoAwal: number;
    Calculated_MutasiIn: number;
    Calculated_MutasiOut: number;
    Calculated_SaldoAkhir: number;
    Part_IUM: string;
    Part_ClassID: string;
    PartClass_Description: string;
    Calculated_PeriodeYYMM: string;
    Calculated_WHPivot: string;
};

type ODataResponse = {
    "@odata.context"?: string;
    value: StockItem[];
};

type ApiResponse = {
    success: boolean;
    data?: StockItem[];
    error?: string;
};

export async function getStockData(
    periode: string,
    searchTerm = "",
    skip = 0,
    take = 50
): Promise<ApiResponse> {
    const cookieStore = await cookies();
    const authHeader = cookieStore.get("session_auth")?.value;

    if (!authHeader) {
        return { success: false, error: "Unauthorized: No session" };
    }

    const filterParts: string[] = [];

    if (searchTerm) {
        const safeSearch = searchTerm.replace(/'/g, "''");
        filterParts.push(
            `(contains(Calculated_PartNum,'${safeSearch}') or contains(Part_PartDescription,'${safeSearch}'))`
        );
    }

    const filterQuery =
        filterParts.length > 0 ? `&$filter=${filterParts.join(" and ")}` : "";

    try {
        const endpoint =
            `/v2/odata/166075/BaqSvc/UDNOV_FGHierarki03_1/Data` +
            `?SelectedPeriode=${periode}` +
            `&$orderby=Calculated_PartNum asc` +
            `&$top=${take}` +
            `&$skip=${skip}` +
            `${filterQuery}`;

        const res = await apiFetch(endpoint, {
            method: "GET",
            authHeader,
            requireLicense: true,
            apiMode: "epicor",
            cache: "no-store",
        });

        if (!res.ok) {
            return {
                success: false,
                error: `Gagal mengambil data: ${res.status} ${res.statusText}`,
            };
        }

        const result = (await res.json()) as ODataResponse;

        return { success: true, data: result.value };
    } catch (error: unknown) {
        console.error("Fetch Stock Error:", error);
        let errorMessage = "Terjadi kesalahan server";
        if (error instanceof Error) errorMessage = error.message;
        return { success: false, error: errorMessage };
    }
}