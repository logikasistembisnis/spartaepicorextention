'use client'

import { Dispatch, SetStateAction } from 'react'
import { SjPlantLine, SjScanLog } from '@/types/sjPlant'
import ScanInput from './ScanInput'
import ScanResultTable from './ScanResultTable'
import SJLineTable from './SJLineTable'
import { getPartIum } from '@/api/sjplant/ium'
import { getPartWarehouseList } from '@/api/sjplant/whse'
import { getPartBinList } from '@/api/sjplant/bin'

const generateGuid = () => {
  if (crypto?.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

interface LinesSectionProps {
  lines: SjPlantLine[]
  setLines: Dispatch<SetStateAction<SjPlantLine[]>>
  scanLogs: SjScanLog[];
  setScanLogs: React.Dispatch<React.SetStateAction<SjScanLog[]>>;
  shipTo: string
}

export default function LinesSection({ lines, setLines, scanLogs, setScanLogs, shipTo }: LinesSectionProps) {
  const getNextLogNum = (lineNum: number) => {
    const logsForLine = scanLogs.filter(l => l.lineNum === lineNum)
    return logsForLine.length > 0
      ? Math.max(...logsForLine.map(l => l.logNum)) + 1
      : 1
  }

  // MAIN SCAN HANDLER (ADD)
  const handleProcessScan = async (rawValue: string) => {

    // FORMAT: PART#DESC#LOT#QTY#GUID#TIMESTAMP
    const parts = rawValue.split('#')

    const partNum = parts[0] || ''
    const partDesc = parts[1] || ''
    const lotNum = parts[2] || ''
    const qty = Number(parts[3]) || 0
    const guid = parts[4] || generateGuid()
    const timestamp = parts[5] || new Date().toISOString()

    // FETCH IUM
    let uom = 'ERR'
    try {
      const res = await getPartIum(partNum)
      if (res.success && res.ium) uom = res.ium
    } catch { }

    // FETCH WAREHOUSE
    let whOptions: { code: string; name: string }[] = []
    let defaultWh = ''

    if (shipTo) {
      const resWh = await getPartWarehouseList(partNum, shipTo)
      if (resWh.success && resWh.data) {
        whOptions = resWh.data.map(w => ({
          code: w.PartWhse_WarehouseCode,
          name: w.Warehse_Description
        }))
        if (whOptions.length === 1) defaultWh = whOptions[0].code
      }
    }

    // FETCH BIN (AUTO IF 1)
    let binOptions: { code: string; desc: string; qty: number }[] = []
    let defaultBin = ''

    if (defaultWh) {
      const resBin = await getPartBinList(partNum, defaultWh, lotNum)
      if (resBin.success && resBin.data) {
        binOptions = resBin.data.map(b => ({
          code: b.BinNum,
          desc: b.BinDesc || b.BinNum,
          qty: b.QtyOnHand
        }))
        if (binOptions.length === 1) defaultBin = binOptions[0].code
      }
    }

    // AGGREGATE LINE
    const existingIndex = lines.findIndex(
      l => l.partNum === partNum && l.lotNum === lotNum
    )

    if (existingIndex !== -1) {
      // BARANG SUDAH ADA → TAMBAH QTY
      const targetLine = lines[existingIndex]
      const nextLogNum = getNextLogNum(targetLine.lineNum)

      // ADD SCAN LOG (HISTORY)
      const scanLog: SjScanLog = {
        guid,
        logNum: nextLogNum,
        lineNum: targetLine.lineNum,
        partNum,
        partDesc,
        lotNum,
        qty,
        qrCode: rawValue,
        timestamp,
        status: 'LOG',
        isNew: true,
      }

      setLines(prev =>
        prev.map((l, idx) => {
          if (idx === existingIndex) {
            const updated = { ...l, qty: l.qty + qty }

            if (l.rawData) {
              updated.pendingLogs = [
                ...(l.pendingLogs || []),
                scanLog,
              ]
            }
            return updated
          }
          return l
        })
      )

      setScanLogs(prev => [scanLog, ...prev])
      return
    }

    // BARANG BARU → CREATE LINE
    const nextLineNum =
      lines.length > 0 ? Math.max(...lines.map(l => l.lineNum)) + 1 : 1

    const scanLog: SjScanLog = {
      logNum: 1,              // LOG PERTAMA DI LINE BARU
      lineNum: nextLineNum,
      guid,
      partNum,
      partDesc,
      lotNum,
      qty,
      qrCode: rawValue,
      timestamp,
      status: 'LOG',
      isNew: true,
    }

    const newLine: SjPlantLine = {
      lineNum: nextLineNum,
      partNum,
      partDesc,
      lotNum,
      qty,
      uom,
      warehouseCode: defaultWh,
      binNum: defaultBin,
      availableWarehouses: whOptions,
      availableBins: binOptions,
      comment: '',
      status: 'UNSHIP',
      pendingLogs: [scanLog],
    }

    setLines(prev => [newLine, ...prev])
    setScanLogs(prev => [scanLog, ...prev])
  }

  return (
    <div className="bg-white rounded-lg shadow-sm mt-2 p-6 border border-gray-200">
      <h3 className="font-bold text-lg text-gray-700 mb-4">Lines Detail</h3>

      <ScanInput onScan={handleProcessScan} />

      <SJLineTable lines={lines} setLines={setLines} />

      <ScanResultTable items={scanLogs} />
    </div>
  )
}
