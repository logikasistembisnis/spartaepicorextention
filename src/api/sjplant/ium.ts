"use server";

import { cookies } from "next/headers";
import { apiFetch } from "@/api/apiFetch";

type ApiPartData = {
  Part_PartNum: string;
  Part_IUM: string;
};

type ODataResponse = {
  "@odata.context"?: string;
  value: ApiPartData[];
};

type ApiResponse = {
  success: boolean;
  ium?: string;
  error?: string;
};

export async function getPartIum(partNum: string): Promise<ApiResponse> {
  const cookieStore = await cookies();
  const authHeader = cookieStore.get("session_auth")?.value;

  if (!authHeader) {
    return { success: false, error: "Unauthorized" };
  }

  try {
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

    // Ambil data pertama jika ada
    if (result.value && result.value.length > 0) {
      // Asumsi semua result memiliki IUM yang sama untuk part ini, ambil yang pertama
      return { success: true, ium: result.value[0].Part_IUM };
    }

    return { success: false, error: "Part not found" };
  } catch (error) {
    console.error("Fetch IUM Error:", error);
    return { success: false, error: "Server Error fetching IUM" };
  }
}
