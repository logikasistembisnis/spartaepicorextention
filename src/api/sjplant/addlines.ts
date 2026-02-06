"use server";

import { cookies } from "next/headers";
import { SjPlantLine, UD100ARawData, SjScanLog } from "@/types/sjPlant";
import { apiFetch } from "@/api/apiFetch";

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

// Fungsi menerima Lines (Agregat) DAN ScanLogs (History)
export async function addLinesToUD100(
  parentKeys: ParentKeys,
  lines: SjPlantLine[],
  scanLogs: SjScanLog[]
) {
  const cookieStore = await cookies();
  const authHeader = cookieStore.get("session_auth")?.value;

  if (!authHeader) return { success: false, message: "Unauthorized" };

  try {
    const ud100aList: UD100ARawData[] = [];

    // 1. MAPPING TYPE 1: SJ LINE TABLE (Data Agregat/Baris Surat Jalan)
    lines.forEach((line) => {
      const validQty = Number(line.qty) || 0;
      const PackQty = Number(line.qtyPack) || 0;
      const lineNumStr = line.lineNum.toString();

      ud100aList.push({
        // Parent Keys (Link ke Header UD100)
        Company: parentKeys.Company,
        Key1: parentKeys.Key1,
        Key2: parentKeys.Key2,
        Key3: parentKeys.Key3,
        Key4: parentKeys.Key4,
        Key5: parentKeys.Key5,

        // Identifier Tipe Data
        ChildKey1: lineNumStr,       // Nomor Baris
        ChildKey2: "",
        ChildKey3: "",
        ChildKey4: "",
        ChildKey5: "SJPlant",        // PENANDA: TIPE LINE TABLE

        // Data Fields
        Character01: line.partDesc,  // Part Desc
        Number01: validQty,          // Total Qty Baris Ini
        Number03: PackQty,

        ShortChar01: line.partNum,   // Part Num
        ShortChar02: line.uom,       // IUM
        ShortChar03: line.warehouseCode, // Wh From
        ShortChar04: line.lotNum,    // Lot Num
        ShortChar05: line.binNum,    // Bin From
        ShortChar06: line.comment,   // Keterangan
        ShortChar09: parentKeys.ShipTo,
        ShortChar10: parentKeys.ShipFrom,

        CheckBox20: line.source === 'QR',
        RowMod: "A",      // Add Baru
      });
    });

    // 2. MAPPING TYPE 2: SCAN RESULT TABLE (Log History Scan)
    scanLogs.forEach((log) => {
      const validQty = Number(log.qty) || 0;

      ud100aList.push({
        // Parent Keys (Sama dengan atas)
        Company: parentKeys.Company,
        Key1: parentKeys.Key1,
        Key2: parentKeys.Key2,
        Key3: parentKeys.Key3,
        Key4: parentKeys.Key4,
        Key5: parentKeys.Key5,

        // Identifier Tipe Data
        ChildKey1: log.logNum.toString(),   //  NOMOR LOG
        ChildKey2: log.lineNum.toString(),  //  LINK KE LINE
        ChildKey3: "",
        ChildKey4: "",
        ChildKey5: "SJPlant#QRCode",    // PENANDA: TIPE SCAN LOG

        // Data Fields
        Character01: log.qrCode,        // Raw Scan String
        Character02: log.partDesc,      // Part Desc
        Character03: log.guid,          // GUID Unik

        ShortChar01: log.partNum,       // Part Num
        ShortChar02: log.lotNum,        // Lot Num
        ShortChar03: log.timestamp,     // Timestamp Scan

        Number01: validQty,             // Qty per scan (pecahan)

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