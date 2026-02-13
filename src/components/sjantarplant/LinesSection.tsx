'use client'

import { Dispatch, SetStateAction } from 'react'
import { SjPlantLine, SjScanLog } from '@/types/sjPlant'
import ScanInput from './ScanInput'
import ScanResultTable from './ScanResultTable'
import SJLineTable from './SJLineTable'
import { getPartIum } from '@/api/sjplant/ium'
import { getPartWarehouseList } from '@/api/sjplant/whse'
import { getPartBinList } from '@/api/sjplant/bin'
import { deleteLineWithLogs } from '@/api/sjplant/deleteline'
import { getDescbyPartNum } from '@/api/sjplant/part'
import { checkGuidExists } from "@/api/sjplant/checkguid"

const generateGuid = () => {
  if (crypto?.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

interface LinesSectionProps {
  lines: SjPlantLine[];
  setLines: Dispatch<SetStateAction<SjPlantLine[]>>;
  scanLogs: SjScanLog[];
  setScanLogs: React.Dispatch<React.SetStateAction<SjScanLog[]>>;
  shipFrom: string;
  onRefresh: () => Promise<void>;
  isLocked: boolean;
}

export default function LinesSection({ lines, setLines, scanLogs, setScanLogs, shipFrom, onRefresh, isLocked }: LinesSectionProps) {
  const getNextLogNum = (lineNum: number) => {
    const logsForLine = scanLogs.filter(l => l.lineNum === lineNum)
    return logsForLine.length > 0
      ? Math.max(...logsForLine.map(l => l.logNum)) + 1
      : 1
  }

  // MAIN SCAN HANDLER (ADD)
  const handleProcessScan = async (rawValue: string) => {
    if (isLocked) {
      alert("Data sudah SHIPPED. Tidak bisa menambah atau mengubah barang.");
      return;
    }

    let partNum = ''
    let partDesc = ''
    let lotNum = ''
    let qty = 0
    let guid = ''
    let timestamp = ''
    let isPipeFormat = false

    // CEK FORMAT QR CODE
    if (rawValue.includes('|')) {
      // FORMAT BARU: PART|1201362|QTY_PACK|LOT|RUNNING_NUMBER|TIMESTAMP
      isPipeFormat = true
      const parts = rawValue.split('|')

      partNum = parts[0] || ''
      qty = Number(parts[2]) || 0
      lotNum = parts[3] || ''
      guid = parts[4] || generateGuid()
      timestamp = parts[5] || new Date().toISOString()

      try {
        const resDesc = await getDescbyPartNum(partNum)

        if (resDesc.success && resDesc.data?.length) {
          partDesc = resDesc.data[0].Part_PartDescription || ''
        }
      } catch {
        partDesc = ''
      }
    } else {
      // FORMAT LAMA: PART#DESC#LOT#QTY#GUID#TIMESTAMP
      const parts = rawValue.split('#')

      partNum = parts[0] || ''
      partDesc = parts[1] || ''
      lotNum = parts[2] || ''
      qty = Number(parts[3]) || 0
      guid = parts[4] || generateGuid()
      timestamp = parts[5] || new Date().toISOString()
    }

    // CEK DUPLIKASI GUID KE DATABASE
    try {
      const resGuid = await checkGuidExists(guid)

      if (!resGuid.success) {
        alert("Gagal validasi GUID ke server")
        return
      }

      if (resGuid.exists && resGuid.data && resGuid.data.length > 0) {
        
        if (isPipeFormat) {
          const isExactDuplicate = resGuid.data.some((row: { UD100A_ShortChar03?: string }) => {
            const dbTime = String(row.UD100A_ShortChar03 || '').trim()
            const scanTime = String(timestamp).trim()
            return dbTime === scanTime
          })

          if (isExactDuplicate) {
            alert(`Double Scan! QR Code ini sudah tersimpan di server.\nGUID: ${guid}\nTime: ${timestamp}`)
            return;
          }
        } else {
          alert("QR Code sudah pernah discan sebelumnya!")
          return; 
        }
      }
    } catch (err) {
      alert("Terjadi kesalahan saat cek GUID")
      return
    }

    // FETCH IUM
    let uom = 'ERR'
    try {
      const res = await getPartIum(partNum)
      if (res.success && res.ium) uom = res.ium
    } catch { }

    // FETCH WAREHOUSE
    let whOptions: { code: string; name: string }[] = []
    let defaultWh = ''

    if (shipFrom) {
      const resWh = await getPartWarehouseList(partNum, shipFrom)
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
      qtyPack: 0,
      uom,
      warehouseCode: defaultWh,
      binNum: defaultBin,
      availableWarehouses: whOptions,
      availableBins: binOptions,
      comment: '',
      status: '',
      pendingLogs: [scanLog],
      source: 'QR'
    }

    setLines(prev => [newLine, ...prev])
    setScanLogs(prev => [scanLog, ...prev])
  }

  const handleDeleteLineLocal = (lineNum: number) => {
    setLines(prev => prev.filter(l => l.lineNum !== lineNum))
    setScanLogs(prev => prev.filter(l => l.lineNum !== lineNum))
  }

  const handleDeleteLine = async (line: SjPlantLine) => {
    if (isLocked) {
      alert("Data sudah SHIPPED. Tidak bisa menghapus line.");
      return;
    }
    const confirm = window.confirm(
      `Hapus line ${line.partNum} - ${line.lotNum}?`
    )
    if (!confirm) return

    // BELUM TERSIMPAN (LOCAL)
    if (!line.rawData) {
      handleDeleteLineLocal(line.lineNum)
      return
    }

    // CARI SEMUA LOG RAW YANG TERKAIT
    const relatedLogRaws = scanLogs
      .filter(
        l =>
          l.lineNum === line.lineNum &&
          l.rawData // PASTI LOG YG SUDAH ADA DI DB
      )
      .map(l => l.rawData!)

    const res = await deleteLineWithLogs(
      line.rawData,
      relatedLogRaws
    )

    if (!res.success) {
      alert(res.message)
      return
    }

    await onRefresh()
  }

  return (
    <div className="bg-white rounded-lg shadow-sm mt-2 p-6 border border-gray-200">
      <h3 className="font-bold text-lg text-gray-700 mb-4">Lines Detail</h3>

      <ScanInput onScan={handleProcessScan} disabled={isLocked} />

      <SJLineTable lines={lines} setLines={setLines} onDeleteLine={handleDeleteLine} isLocked={isLocked} shipFrom={shipFrom} />

      <ScanResultTable items={scanLogs} />
    </div>
  )
}
