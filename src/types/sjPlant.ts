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
  sysRowId: string;
  partNum: string;
  partDesc: string;
  qty: number;
  uom: string;
}