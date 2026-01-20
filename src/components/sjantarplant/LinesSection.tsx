'use client'

import { SjPlantLine } from '@/types/sjPlant'
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline'

interface LinesSectionProps {
  lines: SjPlantLine[];
  setLines: (lines: SjPlantLine[]) => void;
}

export default function LinesSection({ lines, setLines }: LinesSectionProps) {

  const handleAddLine = () => {
    const newLine: SjPlantLine = {
        sysRowId: crypto.randomUUID(),
        partNum: '',
        partDesc: '',
        qty: 0,
        uom: 'PCS'
    }
    setLines([...lines, newLine])
  }

  const handleDeleteLine = (id: string) => {
    setLines(lines.filter(l => l.sysRowId !== id))
  }

  // Handle change row input
  const handleLineChange = (id: string, field: keyof SjPlantLine, value: string | number) => {
    setLines(lines.map(line => {
        if (line.sysRowId === id) {
            return { ...line, [field]: value }
        }
        return line
    }))
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-700">Lines Detail</h3>
        <button 
            onClick={handleAddLine}
            className="flex items-center gap-1 bg-green-600 text-white text-xs px-3 py-2 rounded hover:bg-green-700 transition"
        >
            <PlusIcon className="h-4 w-4" /> Add New Line
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part Number</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">UOM</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {lines.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-400 text-sm">No items added yet.</td>
                    </tr>
                ) : (
                    lines.map((line) => (
                        <tr key={line.sysRowId}>
                            <td className="px-3 py-2">
                                <input 
                                    type="text" 
                                    value={line.partNum}
                                    onChange={(e) => handleLineChange(line.sysRowId, 'partNum', e.target.value)}
                                    className="w-full text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Part Num..."
                                />
                            </td>
                            <td className="px-3 py-2">
                                <input 
                                    type="text" 
                                    value={line.partDesc}
                                    onChange={(e) => handleLineChange(line.sysRowId, 'partDesc', e.target.value)}
                                    className="w-full text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                />
                            </td>
                            <td className="px-3 py-2">
                                <input 
                                    type="number" 
                                    value={line.qty}
                                    onChange={(e) => handleLineChange(line.sysRowId, 'qty', parseFloat(e.target.value))}
                                    className="w-24 text-center text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 mx-auto block"
                                />
                            </td>
                            <td className="px-3 py-2 text-center text-sm text-gray-700">{line.uom}</td>
                            <td className="px-3 py-2 text-center">
                                <button 
                                    onClick={() => handleDeleteLine(line.sysRowId)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>
    </div>
  )
}