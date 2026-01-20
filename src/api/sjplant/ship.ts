"use server";

import { cookies } from "next/headers";

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
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const apiKey = process.env.API_KEY;

  if (!apiUrl || !apiKey) {
    return {
      success: false,
      error: "Konfigurasi server (API URL/KEY) tidak lengkap.",
    };
  }

  const cookieStore = await cookies();
  const authHeader = cookieStore.get("session_auth")?.value;

  if (!authHeader) {
    return { success: false, error: "Unauthorized: Silakan login kembali." };
  }

  try {
    const response = await fetch(
      `${apiUrl}/v2/odata/166075/BaqSvc/GS_PlantForSJ/Data`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          Authorization: authHeader,
        },
        cache: "no-store", // Pastikan data selalu fresh
      }
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