"use server";

import { cookies } from "next/headers";
import { apiFetch } from "@/api/apiFetch";

export type SJItem = {
  id: string;
  packNumber: string;
  actualShipDate: string;
  shipTo: string;
  status: string;
};

interface EpicorBaqRow {
  UD100_Key1: string; // Pack Number
  UD100_Date01: string | null; // Actual Ship Date
  UD100_ShortChar02: string | null; // Ship From
  UD100_ShortChar01: string | null; // Ship To
  UD100_ShortChar06: string | null; // Status
}

interface EpicorBaqResponse {
  value: EpicorBaqRow[];
}

type ActionResponse = {
  success: boolean;
  message?: string;
  data: SJItem[];
};

export async function getSJList(): Promise<ActionResponse> {
  const cookieStore = await cookies();
  const authHeader = cookieStore.get("session_auth")?.value;

  if (!authHeader) {
    return { success: false, message: "Unauthorized.", data: [] };
  }

  try {
    const baqId = "UDNEL_SJPlantQR";
    const queryUrl = `/v2/odata/166075/BaqSvc/${baqId}/Data`;

    const response = await apiFetch(queryUrl, {
      method: "GET",
      authHeader,
      requireLicense: true,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Gagal mengambil data: ${response.statusText}`);
    }

    const result = (await response.json()) as EpicorBaqResponse;
    const mappedData: SJItem[] = result.value.map((item) => {
      let formattedDate = "-";

      if (item.UD100_Date01) {
        const datePart = item.UD100_Date01.split("T")[0];
        const [year, month, day] = datePart.split("-");
        formattedDate = `${day}/${month}/${year}`; 
      }

      return {
        id: item.UD100_Key1,
        packNumber: item.UD100_Key1,
        actualShipDate: formattedDate,
        shipTo: item.UD100_ShortChar01 || "-",
        status: item.UD100_ShortChar06 || "-",
      };
    });

    return { success: true, data: mappedData };
  } catch (error: unknown) {
    let errorMessage = "Gagal mengambil data list.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error("Error fetching SJ List:", errorMessage);

    return { success: false, message: errorMessage, data: [] };
  }
}
