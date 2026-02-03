"use server";

import { cookies } from "next/headers";
import {
  SjPlantHeader,
  UD100RawData,
  SjPlantLine,
  UD100ARawData,
  WarehouseOption,
  BinOption,
  SjScanLog,
} from "@/types/sjPlant";
import { apiFetch } from "@/api/apiFetch";
import { getPartWarehouseList } from "@/api/sjplant/whse";
import { getPartBinList } from "@/api/sjplant/bin";

type GetHeaderResult = {
  success: boolean;
  message?: string;
  data?: SjPlantHeader;
  rawData?: UD100RawData;
  lines?: SjPlantLine[];
  logs?: SjScanLog[];
};

export async function getHeaderById(packNum: string): Promise<GetHeaderResult> {
  const cookieStore = await cookies();
  const authHeader = cookieStore.get("session_auth")?.value;

  if (!authHeader) return { success: false, message: "Unauthorized" };

  try {
    const queryParams = new URLSearchParams({
      key1: packNum,
      key2: "",
      key3: "",
      key4: "",
      key5: "SJPlant",
    });

    const queryUrl = `/v1/Ice.BO.UD100Svc/GetByID?${queryParams.toString()}`;

    const response = await apiFetch(queryUrl, {
      method: "GET",
      authHeader,
      requireLicense: true,
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Gagal mengambil data: ${response.statusText}`,
      };
    }

    const result = await response.json();

    if (
      !result.returnObj ||
      !result.returnObj.UD100 ||
      result.returnObj.UD100.length === 0
    ) {
      return { success: false, message: "Data tidak ditemukan." };
    }

    const raw = result.returnObj.UD100[0] as UD100RawData;

    // --- MAPPING DATA ---
    const headerData: SjPlantHeader = {
      packNum: raw.Key1,
      shipFrom: raw.ShortChar02 || "",
      shipTo: raw.ShortChar01 || "",
      // Date01: "2026-01-19T00:00:00" -> ambil tanggalnya saja
      actualShipDate: raw.Date01 ? raw.Date01.split("T")[0] : "",
      isTgp: raw.CheckBox05 || false,
      comment: raw.Character01 || "",
      isShipped: raw.CheckBox01 || false,
      shipDate: raw.Date02 ? raw.Date02.split("T")[0] : "",
      status: raw.ShortChar06 || "-",
      company: raw.Company,
      sysRowID: raw.SysRowID,
      sysRevID: raw.SysRevID,
      bitFlag: raw.BitFlag,
      rowMod: "U",
      receiptDate: raw.Date03 ? raw.Date03.split("T")[0] : "",
      isReceived: raw.CheckBox02 || false,
      rcvComment: raw.Character02 || "",
    };

    const ud100aList = (result.returnObj.UD100A || []) as UD100ARawData[];

    // 3. PISAHKAN BERDASARKAN CHILDKEY5
    const lineRecords = ud100aList.filter((r) => r.ChildKey5 === "SJPlant");
    const logRecords = ud100aList.filter(
      (r) => r.ChildKey5 === "SJPlant#QRCode",
    );

    const scanLogs: SjScanLog[] = logRecords.map((log) => ({
      guid: log.Character03 || "",
      logNum: Number(log.ChildKey1),
      lineNum: Number(log.ChildKey2),
      partNum: log.ShortChar01 || "",
      partDesc: log.Character02 || "",
      lotNum: log.ShortChar02 || "",
      qty: Number(log.Number01) || 0,
      qrCode: log.Character01 || "",
      timestamp: log.ShortChar03 || "",
      status: log.ShortChar07 || "UNSHIP",
      isNew: false,
      rawData: log,
    }));

    const initialLines: SjPlantLine[] = lineRecords.map((line) => {
      return {
        lineNum: Number(line.ChildKey1),
        partNum: line.ShortChar01 || "",
        partDesc: line.Character01 || "",
        uom: line.ShortChar02 || "",
        warehouseCode: line.ShortChar03 || "",
        lotNum: line.ShortChar04 || "",
        binNum: line.ShortChar05 || "",
        qty: Number(line.Number01) || 0,
        comment: line.ShortChar06 || "",
        status: line.ShortChar07 || "UNSHIP",
        rcvComment: line.Character02 || "",
        binTo: line.Character03 || "",
        whTo: line.ShortChar08 || "",
        shipTo: line.ShortChar09 || "",
        qtyHitung: Number(line.Number02) || 0,
        availableWarehouses: [],
        availableBins: [],
        rawData: line,
      };
    });

    const enrichedLines = await Promise.all(
      initialLines.map(async (line) => {
        let whOptions: WarehouseOption[] = [];
        let binOptions: BinOption[] = [];

        // A. FETCH WAREHOUSE LIST
        if (line.partNum && headerData.shipTo) {
          const whRes = await getPartWarehouseList(
            line.partNum,
            headerData.shipTo,
          );

          if (whRes.success && whRes.data) {
            // Mapping dari ApiWarehouse ke WarehouseOption
            whOptions = whRes.data.map((w) => ({
              code: w.PartWhse_WarehouseCode,
              name: w.Warehse_Description,
            }));
          }
        }

        // B. FETCH BIN LIST
        if (line.partNum && line.whTo) {
          const binRes = await getPartBinList(line.partNum, line.whTo, "");

          const rawBins = binRes.success && binRes.data ? binRes.data : [];

          if (line.binNum) {
            const isBinExist = rawBins.some((b) => b.BinNum === line.binNum);

            if (!isBinExist) {
              rawBins.push({
                BinNum: line.binNum,
                BinDesc: `${line.binNum} (Current)`, // Penanda visual
                QtyOnHand: 0, // Asumsi 0 jika tidak ada di list search
              });
            }
          }

          const uniqueBins = new Map();
          rawBins.forEach((b) => {
            if (!uniqueBins.has(b.BinNum)) {
              uniqueBins.set(b.BinNum, {
                code: b.BinNum,
                desc: b.BinDesc,
                qty: b.QtyOnHand,
              });
            }
          });

          binOptions = Array.from(uniqueBins.values());
        }

        // Return line yang sudah diperkaya dengan opsi dropdown
        return {
          ...line,
          availableWarehouses: whOptions,
          availableBins: binOptions,
        };
      }),
    );

    return {
      success: true,
      data: headerData,
      rawData: raw,
      lines: enrichedLines.sort((a, b) => b.lineNum - a.lineNum),
      logs: scanLogs,
    };
  } catch (error) {
    console.error("Get Header Error:", error);
    return { success: false, message: "Terjadi kesalahan server." };
  }
}
