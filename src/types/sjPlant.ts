export type SjPlantHeader = {
  packNum: string; // Pack Number Plant
  shipFrom: string; // Ship From
  shipTo: string; // Ship To
  actualShipDate: string; // YYYY-MM-DD
  isTgp: boolean; // Checkbox TGP
  comment: string; // Comment Textarea
  isShipped: boolean; // Option Shipped
  shipDate: string; // Option Ship Date
  status: string; // OPEN / CLOSED
  company?: string;
  sysRowID?: string;
  sysRevID?: number;
  bitFlag?: number;
  rowMod?: string;
}

export type SjPlantLine = {
  sysRowId: string;       // Ini pengganti GUID
  lineNum: number;
  partNum: string;
  partDesc: string;
  uom: string;
  warehouseCode: string;
  lotNum: string;
  binNum: string;
  qty: number;
  comment: string;
  status: string;
  qrCode: string;
  timestamp?: string;     
}

export interface UD100RawData {
  Company: string;
  Key1: string;
  Key2: string;
  Key3: string;
  Key4: string;
  Key5: string;
  ShortChar01: string; // ShipFrom
  ShortChar02: string; // ShipTo
  ShortChar06: string; // Status
  ShortChar10: string; // Username
  Date01: string | null; // ActualShipDate
  Date02: string | null; // ShipDate
  Date20: string | null; // CreatedDate
  CheckBox01: boolean; // IsShipped
  CheckBox05: boolean; // IsTgp
  Character01: string; // Comment
  Number20: number; // Counter
  SysRowID: string;
  SysRevID: number;
  BitFlag: number;
  RowMod: string;
  // Index signature untuk menangani properti Epicor lain (Character02, Number05, dll)
  // agar spread operator (...) tidak error
  [key: string]: string | number | boolean | null | undefined;
}
