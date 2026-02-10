"use server";

import { cookies } from "next/headers";
import { SjPlantHeader } from "@/types/sjPlant";
import { apiFetch } from "@/api/apiFetch";

// --- 1. DEFINISI PAYLOAD ---
interface UD100Payload {
  Company: string;
  Key1: string;
  Key2: string;
  Key3: string;
  Key4: string;
  Key5: string;
  ShortChar01: string;
  ShortChar02: string;
  ShortChar06: string;
  ShortChar10: string;
  Date01: string | null;
  Date02: string | null;
  Date20: string | null;
  CheckBox01: boolean;
  CheckBox05: boolean;
  Character01: string;
  Number20: number;
  RowMod: "A";
}

// --- 2. FUNGSI AMBIL NOMOR TERAKHIR (BAQ) ---
async function getLastNumber(authHeader: string) {
  try {
    const baqId = "UDNEL_SJPlantNum";
    const queryUrl = `/v2/odata/166075/BaqSvc/${baqId}/Data?$top=1`;

    const response = await apiFetch(queryUrl, {
      method: "GET",
      authHeader,
      requireLicense: true,
      cache: "no-store",
    });

    if (!response.ok) return 0;

    const result = await response.json();
    if (result.value && result.value.length > 0) {
      const lastRecord = result.value[0];
      return Math.floor(Number(lastRecord.UD100_Number20 || 0));
    }
    return 0;
  } catch (error) {
    console.error(">> [BAQ] Error:", error);
    return 0;
  }
}

function formatKey(numberVal: number): string {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const MM = (now.getMonth() + 1).toString().padStart(2, "0");
  const yyMM = `${yy}${MM}`;
  return `${yyMM}${numberVal.toString().padStart(4, "0")}`;
}

// --- 3. FUNGSI UTAMA SAVE ---
export async function saveHeaderToUD100(header: SjPlantHeader) {
  console.log("=== START ADD HEADER ===");

  const cookieStore = await cookies();
  const authHeader = cookieStore.get("session_auth")?.value;
  if (!authHeader)
    return { success: false, message: "Unauthorized: Session Expired" };

  let username = "System";
  try {
    const base64 = authHeader.split(" ")[1];
    username = Buffer.from(base64, "base64").toString("ascii").split(":")[0];
  } catch (e) {
    console.error(e);
  }

  try {
    const currentLastNumber = await getLastNumber(authHeader);

    let attempts = 0;
    const maxAttempts = 5;
    let success = false;
    let finalResult = null;
    let lastErrorMessage = "";

    while (!success && attempts < maxAttempts) {
      attempts++;
      const tryCounter = currentLastNumber + attempts;
      const tryKey1 = formatKey(tryCounter);

      console.log(`>> Percobaan ke-${attempts}: Key=${tryKey1}`);

      const payload: UD100Payload = {
        Company: "166075",
        Key1: tryKey1,
        Key2: "",
        Key3: "",
        Key4: "",
        Key5: "SJPlant",
        ShortChar02: header.shipFrom,
        ShortChar01: header.shipTo,
        ShortChar06: "OPEN",
        ShortChar10: username,
        Date01: header.actualShipDate
          ? new Date(header.actualShipDate).toISOString()
          : null,
        Date02: header.shipDate
          ? new Date(header.shipDate).toISOString()
          : null,
        Date20: new Date().toISOString(),
        CheckBox01: header.isShipped,
        CheckBox05: header.isTgp,
        Character01: header.comment,
        Number20: tryCounter,
        RowMod: "A",
      };

      const response = await apiFetch(`/v1/Ice.BO.UD100Svc/Update`, {
        method: "POST",
        authHeader,
        requireLicense: true,
        apiMode: "epicor",
        body: JSON.stringify({ ds: { UD100: [payload] } }),
      });

      if (response.ok) {
        try {
          finalResult = await response.json();
        } catch (jsonErr) {
          console.warn("Response OK tapi JSON kosong (mungkin 204 No Content)");
          finalResult = { parameters: {}, ds: { UD100: [payload] } };
        }
        console.log(
          ">> EPICOR SUCCESS RESPONSE:",
          JSON.stringify(finalResult, null, 2),
        );

        success = true;
      } else {
        const status = response.status;
        let errorMessage = `Epicor Error ${status}`;

        // Parsing Error Message
        try {
          const errorJson = await response.json();
          // Prioritas: ErrorMessage > Message > Stringify
          if (errorJson.ErrorMessage) errorMessage = errorJson.ErrorMessage;
          else if (errorJson.Message) errorMessage = errorJson.Message;
          else errorMessage = JSON.stringify(errorJson);
        } catch (e) {
          errorMessage = await response.text();
        }

        lastErrorMessage = errorMessage;

        // Cek DUPLICATE (409)
        if (
          status === 409 ||
          errorMessage.toLowerCase().includes("duplicate") ||
          errorMessage.toLowerCase().includes("already exists") ||
          errorMessage.toLowerCase().includes("key1")
        ) {
          console.warn(`>> Gagal (Duplicate) Key ${tryKey1}. Retrying...`);
          continue; // LANJUT LOOP
        } else {
          // Error lain (misal 401 Unauthorized, 500 Server Error)
          // LANGSUNG BERHENTI & LEMPAR ERROR
          throw new Error(errorMessage);
        }
      }
    }

    if (!success) {
      throw new Error(`Gagal menyimpan setelah ${maxAttempts}x percobaan. Error: ${lastErrorMessage}`);
    }

    return { success: true, data: finalResult };
  } catch (error) {
    console.error(">> FATAL ERROR:", error);
    const msg = error instanceof Error ? error.message : "Server Error";
    return {
      success: false,
      message: msg,
    };
  }
}