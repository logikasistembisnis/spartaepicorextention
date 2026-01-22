"use server";

import { cookies } from "next/headers";
import { apiFetch } from "@/api/apiFetch";

type ApiLot = {
  Part_PartNum: string;
  PartLot_LotNum: string;
};

type ODataResponse = {
  "@odata.context"?: string;
  value: ApiLot[];
};

type ApiResponse = {
  success: boolean;
  data?: ApiLot[];
  error?: string;
};

export async function getPartLots(partNum: string): Promise<ApiResponse> {
  const cookieStore = await cookies();
  const authHeader = cookieStore.get("session_auth")?.value;

  if (!authHeader) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // PENTING: Gunakan $filter OData untuk mengambil lot sesuai PartNum saja
    // Encode URI component untuk menangani karakter spesial jika ada
    const encodedPartNum = encodeURIComponent(partNum);

    const response = await apiFetch(
      `/v2/odata/166075/BaqSvc/UDNEL_LotPartFC/Data?PartNum=${encodedPartNum}`,
      {
        method: "GET",
        authHeader,
        requireLicense: true,
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return { success: false, error: `Error ${response.status}` };
    }

    const result = (await response.json()) as ODataResponse;
    return { success: true, data: result.value };
  } catch (error) {
    console.error("Fetch Lot Error:", error);
    return { success: false, error: "Server Error fetching lots" };
  }
}
