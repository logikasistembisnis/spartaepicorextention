"use server";

import { cookies } from "next/headers";
import { apiFetch } from "@/api/apiFetch";

// Definisikan Tipe Data sesuai Response JSON Epicor
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

type StockResponse = {
    value: StockItem[];
};

export async function getStockData(periode: string) {
    const cookieStore = await cookies();
    const authHeader = cookieStore.get("session_auth")?.value;

    if (!authHeader) {
        return { success: false, message: "Unauthorized: No session" };
    }

    try {
        const res = await apiFetch(
            `/v2/odata/166075/BaqSvc/UDNOV_FGHierarki03_1/Data?SelectedPeriode=${periode}`,
            {
                method: "GET",
                authHeader,
                requireLicense: true,
                apiMode: "epicor",
                cache: "no-store",
            }
        );

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return {
                success: false,
                message: errorData?.ErrorMessage || `Error ${res.status}: ${res.statusText}`
            };
        }

        const data: StockResponse = await res.json();

        return { success: true, data: data.value };

    } catch (error) {
        console.error("Fetch Stock Error:", error);
        return { success: false, message: "Internal Server Error" };
    }
}