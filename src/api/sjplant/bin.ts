"use server";

import { cookies } from "next/headers";
import { apiFetch } from "@/api/apiFetch";

export type ApiBin = {
  BinNum: string;
  BinDesc: string;
  QtyOnHand: number;
};

type PartBinSearchResponse = {
  returnObj: {
    PartBinSearch: ApiBin[];
  };
};

type ApiResponse = {
  success: boolean;
  data?: ApiBin[];
  error?: string;
};

export async function getPartBinList(
  partNum: string,
  whseCode: string,
  lotNum: string,
): Promise<ApiResponse> {
  const cookieStore = await cookies();
  const authHeader = cookieStore.get("session_auth")?.value;

  if (!authHeader) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Construct Where Clause
    let whereClause = `PartNum='${partNum}' AND WhseCode='${whseCode}'`;
    if (lotNum) {
       whereClause += ` AND LotNumber='${lotNum}'`;
    }

    const body = {
      pageSize: 0,
      absolutePage: 0,
      whereClause: whereClause,
    };

    const response = await apiFetch(
      `/v1/Erp.BO.PartBinSearchSvc/GetPartBinSearch`,
      {
        method: "POST",
        authHeader,
        requireLicense: true,
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return { success: false, error: `Error: ${response.status}` };
    }

    const result = (await response.json()) as PartBinSearchResponse;

    // Ambil array PartBinSearch dari returnObj
    const list = result.returnObj?.PartBinSearch || [];

    return { success: true, data: list };
  } catch (error: unknown) {
    console.error("Server Action Error (getPartBinList):", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown Error",
    };
  }
}
