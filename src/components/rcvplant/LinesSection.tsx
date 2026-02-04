'use client'

import { Dispatch, SetStateAction } from 'react'
import { SjPlantLine, SjScanLog } from '@/types/sjPlant'
import ScanResultTable from './ScanResultTable'
import SJLineTable from './SJLineTable'

interface LinesSectionProps {
  lines: SjPlantLine[];
  setLines: Dispatch<SetStateAction<SjPlantLine[]>>;
  scanLogs: SjScanLog[];
  setScanLogs: React.Dispatch<React.SetStateAction<SjScanLog[]>>;
  isLocked: boolean;
}

export default function LinesSection({ lines, setLines, scanLogs, setScanLogs, isLocked }: LinesSectionProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm mt-2 p-6 border border-gray-200">
      <h3 className="font-bold text-lg text-gray-700 mb-4">Lines Detail</h3>

      <SJLineTable lines={lines} setLines={setLines} isLocked={isLocked}/>

      <ScanResultTable items={scanLogs} />
    </div>
  )
}
