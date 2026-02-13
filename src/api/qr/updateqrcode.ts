"use server";

import { cookies } from "next/headers";
import { apiFetch } from "@/api/apiFetch";

// Tipe data untuk Update
export type UpdateUD14Item = {
  Company: string;
  Key1: string;
  Key2: string;
  Key5: string;
  SysRowID: string;
  SysRevID: number;
  Character01?: string;
  Number01?: number;
  Number02?: number;
  Number03?: number;
  Number04?: number;
  ShortChar20?: string;
  ShortChar01?: string;
  ShortChar02?: string;
  ShortChar03?: string;
  ShortChar04?: string;
  Date01: string;
};

export async function updateUD14(items: UpdateUD14Item[]) {
  const cookieStore = await cookies();
  const authHeader = cookieStore.get("session_auth")?.value;

  if (!authHeader) {
    return { success: false, message: "Unauthorized: Silakan login ulang." };
  }

  // Siapkan Payload untuk Epicor
  const ud14Rows = items.map((item) => ({
    ...item,
    RowMod: "U", // Tandai sebagai Update
  }));

  const payload = {
    ds: {
      UD14: ud14Rows,
    },
  };

  try {
    const response = await apiFetch(`/v2/Ice.BO.UD14Svc/Update`, {
      method: "POST",
      authHeader,
      requireLicense: true,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Epicor Update Error:", errorText);
      return {
        success: false,
        message: `Gagal update ke Epicor: ${response.statusText}`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Fetch Error:", error);
    return { success: false, message: "Terjadi kesalahan server saat update." };
  }
}
