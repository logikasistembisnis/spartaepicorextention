'use client'

import { Dispatch, SetStateAction } from 'react'
import { SjPlantLine, SjScanLog } from '@/types/sjPlant'
import ScanInput from './ScanInput'
import SJLineTable from './SJLineTable'
import { checkGuidExists } from '@/api/sjplant/checkguid'

interface LinesSectionProps {
  lines: SjPlantLine[];
  setLines: Dispatch<SetStateAction<SjPlantLine[]>>;
  scanLogs: SjScanLog[];
  setScanLogs: React.Dispatch<React.SetStateAction<SjScanLog[]>>;
  isLocked: boolean;
}

export default function LinesSection({ lines, setLines, scanLogs, setScanLogs, isLocked }: LinesSectionProps) {
  const handleProcessScan = async (rawValue: string) => {
    if (isLocked) {
      alert("Data sudah LOCKED")
      return
    }

    // FORMAT: PART#DESC#LOT#QTY#GUID#TIMESTAMP
    const parts = rawValue.split('#')

    const partNum = parts[0]
    const partDesc = parts[1]
    const lotNum = parts[2]
    const qtyInput = Number(parts[3]) || 0
    const guid = parts[4]

    if (!guid) {
      alert("GUID tidak ditemukan di QR")
      return
    }

    const lineIndex = lines.findIndex(l => l.partNum === partNum && l.lotNum === lotNum);

    if (lineIndex === -1) {
        alert(`Part Number ${partNum} dengan Lot ${lotNum} tidak ditemukan di daftar Line!`);
        return;
    }

    // CEK GUID KE DB
    const res = await checkGuidExists(guid)

    if (!res.success) {
      alert(res.message)
      return
    }

    if (!res.exists || res.data.length === 0) {
      alert("GUID tidak ada di database")
      return
    }

    const serverData = res.data[0];

    const currentStatus = serverData.sjplant_ShortChar07;

    if (currentStatus === 'Received') {
      alert(`Barang dengan GUID ini sudah Received`);
      return;
    }

    if (currentStatus !== 'Shipped') {
      alert(`Barang belum status 'Shipped'. Harap selesaikan proses pengiriman dulu.`);
      return;
    }
    setLines(prevLines => {
        return prevLines.map((line, idx) => {
            if (idx === lineIndex) {
                const currentPcs = line.qtyHitungPcs || 0;
                const currentPack = line.qtyPack || 1; 

                let newPack = currentPack;
                let newPcs = currentPcs;

                if (currentPcs === 0) {
                    newPcs = qtyInput;
                    
                    if (newPack === 0) newPack = 1; 
                } else {
                    newPack = currentPack + 1;
                    newPcs = currentPcs + qtyInput;
                }

                return {
                    ...line,
                    qtyPack: newPack,
                    qtyHitungPcs: newPcs
                };
            }
            return line;
        });
    });
  }

  return (
    <div className="bg-white rounded-lg shadow-sm mt-2 p-6 border border-gray-200">
      <h3 className="font-bold text-lg text-gray-700 mb-4">Lines Detail</h3>

      <ScanInput onScan={handleProcessScan} disabled={isLocked} />

      <SJLineTable lines={lines} setLines={setLines} isLocked={isLocked} />
    </div>
  )
}
