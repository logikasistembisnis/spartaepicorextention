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

// Parameter kita buat lebih fleksibel
export async function getSJList(
  skip = 0,
  take = 50,
  searchTerm = "",
  // statuses bisa berupa array string, misal: ['Shipped', 'Received'] atau null/empty untuk "All"
  statuses: string[] = [] 
): Promise<ActionResponse> {
  const cookieStore = await cookies();
  const authHeader = cookieStore.get("session_auth")?.value;

  if (!authHeader) {
    return { success: false, message: "Unauthorized.", data: [] };
  }

  try {
    const baqId = "UDNEL_SJPlantQR";
    
    const filterParts: string[] = [];

    // Handle Search
    if (searchTerm) {
      // Filter by Pack Number (Key1)
      filterParts.push(`contains(UD100_Key1,'${searchTerm}')`);
    }

    // Handle Status Filter
    // Jika statuses ada isinya, kita buat logika OR (misal: Status eq 'Shipped' or Status eq 'Received')
    if (statuses.length > 0) {
        // Ex: (UD100_ShortChar06 eq 'Shipped' or UD100_ShortChar06 eq 'Received')
        const statusLogic = statuses
            .map(s => `UD100_ShortChar06 eq '${s}'`)
            .join(' or ');
        filterParts.push(`(${statusLogic})`);
    }

    // Gabungkan Search dan Status dengan ' and '
    const filterQuery = filterParts.length > 0 
        ? `&$filter=${filterParts.join(' and ')}` 
        : "";

    const queryUrl = `/v2/odata/166075/BaqSvc/${baqId}/Data` +
      `?$orderby=UD100_Key1 desc&$top=${take}&$skip=${skip}${filterQuery}`;

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