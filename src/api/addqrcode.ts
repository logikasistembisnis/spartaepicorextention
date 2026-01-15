"use server";

import { cookies } from "next/headers";

// Tipe data input dari Client
type SavePartItem = {
  partNumber: string;
  description: string;
  qtyBox: number;
};

export async function saveToUD14(items: SavePartItem[]) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const apiKey = process.env.API_KEY;
  // Pastikan API URL & Key ada
  if (!apiUrl || !apiKey) {
    return {
      success: false,
      error: "Konfigurasi server (API URL/KEY) tidak lengkap.",
    };
  }

  // Ambil Session Auth dari Cookies
  const cookieStore = await cookies();
  const authSession = cookieStore.get("session_auth")?.value;

  if (!authSession) {
    return { success: false, message: "Unauthorized: Silakan login ulang." };
  }

  // Decode Username dari Basic Auth
  let username = "";
  try {
    // Format Basic Auth adalah "Basic base64(user:pass)"
    const base64Credentials = authSession.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString(
      "ascii"
    );
    username = credentials.split(":")[0]; // Ambil username saja
  } catch (e) {
    console.error("Gagal decode username", e);
    return { success: false, message: "Gagal membaca user session." };
  }

  // Generate Timestamp (yymmddHHmmss)
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const MM = (now.getMonth() + 1).toString().padStart(2, "0");
  const dd = now.getDate().toString().padStart(2, "0");
  const HH = now.getHours().toString().padStart(2, "0");
  const mm = now.getMinutes().toString().padStart(2, "0");
  const ss = now.getSeconds().toString().padStart(2, "0");

  const timestamp = `${yy}${MM}${dd}${HH}${mm}${ss}`;

  const ud14Rows = items.map((item) => {
    // Unik Key1: PartNum + # + Timestamp
    const key1 = `${item.partNumber}#${timestamp}`;

    return {
      Company: "166075",
      Key1: key1,
      Key2: item.partNumber,
      Key3: "",
      Key4: "",
      Key5: "FCQRCode", // Hardcode
      Character01: item.description, // Deskripsi Part
      Number01: item.qtyBox, // Qty Box
      ShortChar20: username, // User ID dari Cookie
      RowMod: "A",
    };
  });

  const payload = {
    ds: {
      UD14: ud14Rows,
    },
  };

  // Kirim ke API Epicor
  try {
    const response = await fetch(
      `${apiUrl}/v1/Ice.BO.UD14Svc/Update`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          Authorization: authSession,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Epicor Error:", errorText);
      return {
        success: false,
        message: `Gagal simpan ke Epicor: ${response.statusText}`,
      };
    }

    const result = await response.json();

    return { success: true, data: result };
  } catch (error) {
    console.error("Fetch Error:", error);
    return { success: false, message: "Terjadi kesalahan server." };
  }
}
