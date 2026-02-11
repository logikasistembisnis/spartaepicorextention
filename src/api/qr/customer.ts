"use server"

import { cookies } from "next/headers"
import { apiFetch } from "@/api/apiFetch"
import { CustomerItem } from "@/types/qr"

type ApiCustomer = {
    Customer_CustID: string
    Customer_CustNum: number
    Customer_Name: string
}

type ODataResponse = {
    value: ApiCustomer[]
}

export async function getCustomerList(): Promise<{
    success: boolean
    data?: CustomerItem[]
    error?: string
}> {
    const cookieStore = await cookies()
    const authHeader = cookieStore.get("session_auth")?.value

    if (!authHeader) {
        return { success: false, error: "Unauthorized" }
    }

    try {
        const res = await apiFetch(
            `/v2/odata/166075/BaqSvc/UDNEL_Customer/Data`,
            {
                method: "GET",
                authHeader,
                requireLicense: true,
                cache: "no-store",
            }
        )

        if (!res.ok) {
            return { success: false, error: res.statusText }
        }

        const json = (await res.json()) as ODataResponse

        const mapped: CustomerItem[] = json.value.map(c => ({
            custID: c.Customer_CustID,
            custNum: c.Customer_CustNum,
            custName: c.Customer_Name,
        }))

        return { success: true, data: mapped }
    } catch (e) {
        return { success: false, error: "Server error" }
    }
}
