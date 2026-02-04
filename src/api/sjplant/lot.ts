"use server";

import { cookies } from "next/headers";
import { apiFetch } from "@/api/apiFetch";

export type ApiLot = {
    LotNum: string;
    OnHand: boolean;
};

type LotListResponse = {
    returnObj: {
        PartLotList: ApiLot[];
    };
};

type ApiResponse = {
    success: boolean;
    data?: ApiLot[];
    error?: string;
};

export async function getPartLotList(partNum: string): Promise<ApiResponse> {
    const cookieStore = await cookies();
    const authHeader = cookieStore.get("session_auth")?.value;

    if (!authHeader) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        // Construct Query Params
        const whereClause = `OnHand = true AND PartNum = '${partNum}' BY LotNum`;

        const params = new URLSearchParams({
            whereClause: whereClause,
            pageSize: "50",
            absolutePage: "1",
        });

        const response = await apiFetch(
            `/v1/Erp.BO.LotSelectUpdateSvc/GetList?${params.toString()}`,
            {
                method: "GET", // Method GET
                authHeader,
                requireLicense: true,
                cache: "no-store",
            }
        );

        if (!response.ok) {
            return { success: false, error: `Error: ${response.status}` };
        }

        const result = (await response.json()) as LotListResponse;

        // Ambil array dari returnObj
        const list = result.returnObj?.PartLotList || [];

        return { success: true, data: list };
    } catch (error: unknown) {
        console.error("Server Action Error (getPartLotList):", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown Error",
        };
    }
}