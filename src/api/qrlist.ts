"use server";

import { cookies } from "next/headers";

export type qrList = {
  UD14_Company: string;
  UD14_Key1: string; // ID Unik
  UD14_Key2: string; // Part Number
  UD14_Character01: string; // Description
  UD14_Number01: number; // Qty
  UD14_Key5: string;
  UD14_ShortChar01: string;
  UD14_ShortChar20: string;
  UD14_SysRowID: string;
  UD14_SysRevID: number;
};

type ODataResponse = {
  "@odata.context"?: string;
  value: qrList[];
};

type ApiResponse = {
  success: boolean;
  data?: qrList[];
  error?: string;
};

export async function getGeneratedQRList(): Promise<ApiResponse>  {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const apiKey = process.env.API_KEY;

  // Pastikan API URL & Key ada
  if (!apiUrl || !apiKey) {
    return {
      success: false,
      error: "Konfigurasi server (API URL/KEY) tidak lengkap.",
    };
  }

  // Ambil Auth Token dari Cookie
  const cookieStore = await cookies();
  const authHeader = cookieStore.get("session_auth")?.value;

  if (!authHeader) {
    return { success: false, error: "Unauthorized: Silakan login kembali." };
  }

  try {
    const response = await fetch(
      `${apiUrl}/v2/odata/166075/BaqSvc/UDNEL_FCQRCode/Data`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          Authorization: authHeader,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return {
        success: false,
        error: `Gagal mengambil data: ${response.status} ${response.statusText}`,
      };
    }

    const result = (await response.json()) as ODataResponse;

    return { success: true, data: result.value };
  } catch (error: unknown) {
    console.error("Server Action Error:", error);

    let errorMessage = "Terjadi kesalahan server";

    if (error instanceof Error) {
      // Jika error adalah instance object Error standar
      errorMessage = error.message;
    } else if (typeof error === "string") {
      // Jika error berupa string biasa
      errorMessage = error;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function deleteQRItem(
  key1: string,
  key2: string,
  key3: string = '',
  key4: string = '',
  key5: string = ''
): Promise<{ success: boolean; message?: string }> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const apiKey = process.env.API_KEY;

  // 1. Validasi Config
  if (!apiUrl || !apiKey) {
    return {
      success: false,
      // FIX: Ganti 'error' jadi 'message' agar sesuai tipe return
      message: "Konfigurasi server (API URL/KEY) tidak lengkap.",
    };
  }

  // 2. Validasi Auth
  const cookieStore = await cookies();
  const authSession = cookieStore.get("session_auth")?.value;

  if (!authSession) {
    return { success: false, message: "Unauthorized: Silakan login ulang." };
  }

  try {
    // 3. Payload untuk DeleteByID harus Object JSON, bukan string OData
    // Nama key (key1, key2, dst) harus match dengan parameter method Epicor
    const payload = {
        key1: key1,
        key2: key2,
        key3: key3,
        key4: key4,
        key5: key5
    };

    // 4. Panggil Endpoint DeleteByID
    // Penting: Method biasanya POST untuk RPC call di Epicor REST v1
    const response = await fetch(`${apiUrl}/v1/Ice.BO.UD14Svc/DeleteByID`, {
      method: 'POST', 
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        Authorization: authSession,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json() as unknown;
      let serverMsg = "Gagal menghapus data";
      
      if (typeof errorData === 'object' && errorData !== null && 'ErrorMessage' in errorData) {
        serverMsg = (errorData as { ErrorMessage: string }).ErrorMessage;
      }
      
      throw new Error(serverMsg);
    }

    return { success: true };

  } catch (error: unknown) {
    console.error("Delete Error:", error);

    let message = "Terjadi kesalahan yang tidak diketahui";

    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    return { success: false, message };
  }
}