"use server";

import { cookies } from "next/headers";
import { apiFetch } from "@/api/apiFetch";

export async function RetInvShip(payload: {
    SJPlant: string;
    ShipFrom: string;
    ShipTo: string;
    Date: string;
}) {
    const cookieStore = await cookies();
    const authHeader = cookieStore.get("session_auth")?.value;

    if (!authHeader) return { success: false, message: "Unauthorized" };

    const res = await apiFetch(
        "/v2/efx/166075/UDNELSJAntarPlant/ReturnInventoryTransfer",
        {
            method: "POST",
            authHeader,
            requireLicense: true,
            body: JSON.stringify({ ...payload, Check: false })
        }
    );

    return await res.json();
}
