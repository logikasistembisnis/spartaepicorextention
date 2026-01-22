"use server";

import { cookies } from "next/headers";

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

export async function getPartBinList(partNum: string, whseCode: string, lotNum: string): Promise<ApiResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const apiKey = process.env.API_KEY;

  if (!apiUrl || !apiKey) {
    return { success: false, error: "Config Error" };
  }

  const cookieStore = await cookies();
  const authHeader = cookieStore.get("session_auth")?.value;

  if (!authHeader) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Construct Where Clause
    const whereClause = `PartNum='${partNum}' AND WhseCode='${whseCode}' AND LotNumber='${lotNum}'`;

    const body = {
      pageSize: 0,
      absolutePage: 0,
      whereClause: whereClause,
    };

    const response = await fetch(
      `${apiUrl}/v1/Erp.BO.PartBinSearchSvc/GetPartBinSearch`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          Authorization: authHeader,
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
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