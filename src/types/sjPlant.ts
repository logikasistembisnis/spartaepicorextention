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
  receiptDate?: string;
  isReceived?: boolean;
  rcvComment?: string;
}

export type SjPlantLine = {
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
  rcvComment?: string;
  binTo?: string;
  whTo?: string;
  shipTo?: string;
  qtyHitung?: number;
  availableWarehouses?: WarehouseOption[];   
  availableBins?: BinOption[];
  rawData?: UD100ARawData;
  pendingLogs?: SjScanLog[];
  availableLots?: LotOption[];
  source?: 'QR' | 'MANUAL'
}

export interface SjScanLog {
  logNum: number;
  lineNum: number;
  partNum: string;
  partDesc: string;
  lotNum: string;
  qty: number;        // Qty per scan (bukan total)
  qrCode: string;     // Raw String QR
  guid: string;       // GUID unik dari QR
  timestamp: string;  // Waktu scan
  status: string;
  isNew?: boolean;
  rawData?: UD100ARawData;
}

export interface WarehouseOption {
  code: string;
  name: string;
}

export interface BinOption {
  code: string; // BinNum
  desc: string; // BinDesc
  qty: number;  // QtyOnHand
}

export interface LotOption {
  lotNum: string;
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
  Date03: string | null;
  Date20: string | null; // CreatedDate
  CheckBox01: boolean; // IsShipped
  CheckBox02: boolean | null; // IsReceived
  CheckBox05: boolean; // IsTgp
  Character01: string; // Comment
  Character02: string | null; // Rcv Comment
  Number20: number; // Counter
  SysRowID: string;
  SysRevID: number;
  BitFlag: number;
  RowMod: string;
  // Index signature untuk menangani properti Epicor lain (Character02, Number05, dll)
  // agar spread operator (...) tidak error
  [key: string]: string | number | boolean | null | undefined;
}

export interface UD100ARawData {
  Company: string;
  Key1: string;
  Key2: string;
  Key3: string;
  Key4: string;
  Key5: string;
  ChildKey1: string;
  ChildKey2: string;
  ChildKey3: string; 
  ChildKey4: string;
  ChildKey5: string;
  Character01?: string;
  Character02?: string;
  Character03?: string;
  Character04?: string;
  Character05?: string;
  ShortChar01?: string;
  ShortChar02?: string;
  ShortChar03?: string;
  ShortChar04?: string;
  ShortChar05?: string;
  ShortChar06?: string;
  ShortChar07?: string;
  ShortChar08?: string;
  ShortChar09?: string;
  ShortChar10?: string;
  CheckBox20?: boolean;
  Number01?: number;
  Number02?: number;
  SysRowID?: string;
  RowMod: string;
}