"use server";

import { cookies } from "next/headers";
import { SjPlantLine, UD100ARawData } from "@/types/sjPlant";
import { apiFetch } from "@/api/apiFetch";

// Kita butuh Key1 - Key5 untuk tahu Induknya siapa
export type ParentKeys = {
  Company: string;
  Key1: string;
  Key2: string;
  Key3: string;
  Key4: string;
  Key5: string;
  ShipFrom: string;
  ShipTo: string;
};

export async function addLinesToUD100(
  parentKeys: ParentKeys,
  lines: SjPlantLine[],
) {
  const cookieStore = await cookies();
  const authHeader = cookieStore.get("session_auth")?.value;

  if (!authHeader) return { success: false, message: "Unauthorized" };

  try {
    const ud100aList: UD100ARawData[] = [];

    lines.forEach((line) => {
      const validQty = Number(line.qty) || 0;
      const lineNumStr = line.lineNum.toString();

      // --- RECORD 1: DATA FISIK (Tampilan Table) ---
      ud100aList.push({
        Company: parentKeys.Company,
        Key1: parentKeys.Key1,
        Key2: parentKeys.Key2,
        Key3: parentKeys.Key3,
        Key4: parentKeys.Key4,
        Key5: parentKeys.Key5, // Link ke Parent

        ChildKey1: lineNumStr,
        ChildKey2: "",
        ChildKey3: "",
        ChildKey4: "",
        ChildKey5: parentKeys.Key5, // Penanda Tipe Data Baris

        Character01: line.partDesc,
        Number01: validQty,

        ShortChar01: line.partNum,
        ShortChar02: line.uom,
        ShortChar03: line.warehouseCode,
        ShortChar04: line.lotNum,
        ShortChar05: line.binNum,
        ShortChar06: line.comment,
        ShortChar09: parentKeys.ShipTo,
        ShortChar10: parentKeys.ShipFrom,
        CheckBox20: true,
        RowMod: "A", // Add Baru
      });

      // --- RECORD 2: LOG QR CODE (Hidden) ---
      ud100aList.push({
        Company: parentKeys.Company,
        Key1: parentKeys.Key1,
        Key2: parentKeys.Key2,
        Key3: parentKeys.Key3,
        Key4: parentKeys.Key4,
        Key5: parentKeys.Key5,

        ChildKey1: lineNumStr,
        ChildKey2: "",
        ChildKey3: "",
        ChildKey4: "",
        ChildKey5: "SJPlant#QRCode", // Penanda Tipe QR

        Character01: line.qrCode,
        Character02: line.partDesc,
        Character03: line.guid, // GUID Scan

        ShortChar01: line.partNum,
        ShortChar02: line.lotNum,
        ShortChar03: line.timestamp,
        Number01: validQty,
        RowMod: "A", // Add Baru
      });
    });

    const payload = {
      ds: {
        UD100A: ud100aList,
      },
    };

    const endpoint = `/v1/Ice.BO.UD100Svc/Update`;
    const response = await apiFetch(endpoint, {
      method: "POST",
      authHeader,
      requireLicense: true,
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Gagal Save Line: ${response.statusText}`,
      };
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error("Add Lines Error:", error);
    return { success: false, message: "Server Error saat simpan Line" };
  }
}
