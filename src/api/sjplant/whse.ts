"use server";

import { cookies } from "next/headers";
import { apiFetch } from "@/api/apiFetch";

export type ApiWarehouse = {
  PartWhse_Company: string;
  PartWhse_PartNum: string;
  PartWhse_WarehouseCode: string; // Ini yang akan jadi value dropdown
  Warehse_Description: string; // Ini yang akan jadi label dropdown
  Warehse_Address3: string; // Ini filter Ship To
  RowIdent: string;
};

type ODataResponse = {
  "@odata.context"?: string;
  value: ApiWarehouse[];
};

type ApiResponse = {
  success: boolean;
  data?: ApiWarehouse[];
  error?: string;
};

// Fungsi menerima parameter PartNum & ShipFrom untuk filtering
export async function getPartWarehouseList(
  partNum: string,
  shipFrom: string,
): Promise<ApiResponse> {
  const cookieStore = await cookies();
  const authHeader = cookieStore.get("session_auth")?.value;

  if (!authHeader) {
    return { success: false, error: "Unauthorized: Silakan login kembali." };
  }

  try {
    // Encode parameter agar aman (menangani spasi atau karakter khusus)
    const encodedPart = encodeURIComponent(partNum);
    const encodedShipFrom = encodeURIComponent(shipFrom);

    // Buat Query OData:
    // Filter dimana PartWhse_PartNum == inputPart DAN Warehse_Address3 == inputShipFrom
    const queryFilter = `$filter=PartWhse_PartNum eq '${encodedPart}' and Warehse_Address3 eq '${encodedShipFrom}'`;

    const fullUrl = `/v2/odata/166075/BaqSvc/GS_WarehouseListSJ/Data?${queryFilter}`;

    const response = await apiFetch(fullUrl, {
      method: "GET",
      authHeader,
      requireLicense: true,
      cache: "no-store", // Pastikan data selalu fresh
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Gagal mengambil data warehouse: ${response.status} ${response.statusText}`,
      };
    }

    const result = (await response.json()) as ODataResponse;

    return { success: true, data: result.value };
  } catch (error: unknown) {
    console.error("Server Action Error (getPartWarehouseList):", error);
    let errorMessage = "Terjadi kesalahan server";
    if (error instanceof Error) errorMessage = error.message;
    else if (typeof error === "string") errorMessage = error;

    return {
      success: false,
      error: errorMessage,
    };
  }
}
