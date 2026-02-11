'use client'

import { useState, useEffect, useMemo } from 'react'
import {
    MagnifyingGlassIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline'
import { getCustomerList } from '@/api/qr/customer'
import { CustomerItem } from '@/types/qr'

interface SelectCustomerProps {
    onSelect: (customer: CustomerItem) => void
}

export default function SelectCustomer({ onSelect }: SelectCustomerProps) {
    const [customers, setCustomers] = useState<CustomerItem[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const res = await getCustomerList()
                if (res.success && res.data) {
                    setCustomers(res.data)
                } else {
                    setError(res.error || 'Gagal memuat data customer')
                }
            } catch {
                setError('Terjadi kesalahan jaringan')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const filteredCustomers = useMemo(() => {
        return customers.filter(c =>
            c.custID.toLowerCase().includes(search.toLowerCase()) ||
            c.custName.toLowerCase().includes(search.toLowerCase())
        )
    }, [customers, search])

    return (
        <div className="flex flex-col h-full w-full bg-white">

            {/* HEADER + SEARCH */}
            <div className="shrink-0 bg-white px-4 py-2 border-b border-gray-100">
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full rounded-md border-0 py-2 pl-9 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600"
                        placeholder="Cari Customer ID / Customer Name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden">

                {/* LOADING */}
                {loading && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-white bg-opacity-90">
                        <ArrowPathIcon className="h-8 w-8 text-gray-600 animate-spin" />
                        <span className="text-sm text-gray-500">Memuat data customer...</span>
                    </div>
                )}

                {/* ERROR */}
                {error && !loading && (
                    <div className="flex-1 flex items-center justify-center p-8 text-sm text-red-500">
                        {error}
                    </div>
                )}

                {/* TABLE */}
                {!loading && !error && (
                    <div className="flex-1 overflow-y-auto overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 table-fixed">
                            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-10 py-3 text-left w-50 text-xs font-semibold text-gray-900 uppercase">
                                        Customer ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">
                                        Customer Name
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredCustomers.length > 0 ? (
                                    filteredCustomers.map((cust) => (
                                        <tr
                                            key={cust.custNum}
                                            onClick={() => onSelect(cust)}
                                            className="cursor-pointer hover:bg-gray-50 transition"
                                        >
                                            <td className="px-10 py-2 text-xs md:text-sm font-mono text-gray-900">
                                                {cust.custID}
                                            </td>
                                            <td className="px-6 py-2 text-xs md:text-sm text-gray-900 line-clamp-2">
                                                {cust.custName}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={2} className="px-6 py-20 text-center text-sm text-gray-500">
                                            Customer tidak ditemukan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
