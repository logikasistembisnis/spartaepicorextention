"use server";

import { cookies } from "next/headers";
import { apiFetch } from "@/api/apiFetch";

export type IncomingItem = {
    Calculated_PartNum: string;
    Calculated_PartDescription: string;
    Calculated_TranDate: string;
    Calculated_TranTypeDesc: string;
    Calculated_PartIUM: string;
    Calculated_MutasiIn: number;
    Calculated_DocNo: string;
    Calculated_Keterangan: string;
};

type IncomingResponse = {
    value: IncomingItem[];
};

export async function getIncomingData(periode: string, partNum: string) {
    const cookieStore = await cookies();
    const authHeader = cookieStore.get("session_auth")?.value;

    if (!authHeader) {
        return { success: false, message: "Unauthorized: No session" };
    }

    const encodedPartNum = encodeURIComponent(partNum);

    try {
        const res = await apiFetch(
            `/v2/odata/166075/BaqSvc/UDNOV_FGHierarki03_2/Data?SelectedPeriode=${periode}&SelectedPartNum=${encodedPartNum}`,
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

        const data: IncomingResponse = await res.json();
        return { success: true, data: data.value };

    } catch (error) {
        console.error("Fetch Incoming Error:", error);
        return { success: false, message: "Internal Server Error" };
    }
}