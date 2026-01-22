"use server";

import { cookies } from "next/headers";
import { apiFetch } from "@/api/apiFetch";

export type ApiShip = {
  Warehse_Address3: string;
  RowIdent: string;
};

type ODataResponse = {
  "@odata.context"?: string;
  value: ApiShip[];
};

type ApiResponse = {
  success: boolean;
  data?: ApiShip[];
  error?: string;
};

export async function getPlantsList(): Promise<ApiResponse> {
  const cookieStore = await cookies();
  const authHeader = cookieStore.get("session_auth")?.value;

  if (!authHeader) {
    return { success: false, error: "Unauthorized: Silakan login kembali." };
  }

  try {
    const response = await apiFetch(
      `/v2/odata/166075/BaqSvc/GS_PlantForSJ/Data`,
      {
        method: "GET",
        authHeader,
        requireLicense: true,
        cache: "no-store", // Pastikan data selalu fresh
      },
    );

    if (!response.ok) {
      return {
        success: false,
        error: `Gagal mengambil data plant: ${response.status} ${response.statusText}`,
      };
    }

    const result = (await response.json()) as ODataResponse;

    return { success: true, data: result.value };
  } catch (error: unknown) {
    console.error("Server Action Error (getPlantsList):", error);
    let errorMessage = "Terjadi kesalahan server";
    if (error instanceof Error) errorMessage = error.message;
    else if (typeof error === "string") errorMessage = error;

    return {
      success: false,
      error: errorMessage,
    };
  }
}
